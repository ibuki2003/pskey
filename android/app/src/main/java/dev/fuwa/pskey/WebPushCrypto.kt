package dev.fuwa.pskey

import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import java.math.BigInteger
import java.nio.ByteBuffer
import java.nio.charset.Charset
import java.nio.charset.StandardCharsets
import java.security.AlgorithmParameters
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.SecureRandom
import java.security.spec.ECGenParameterSpec
import java.security.spec.ECParameterSpec
import java.security.spec.ECPoint
import java.security.spec.ECPrivateKeySpec
import java.security.spec.ECPublicKeySpec
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.Mac
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec


class WebPushCrypto(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "WebPushCrypto"

  private val UTF8: Charset = StandardCharsets.UTF_8 //$NON-NLS-1$
  private val ecStdName = "secp256r1"

  private fun bnToBytes(bn: BigInteger): ByteArray {
    val bytes = bn.toByteArray()
    if (bytes.size > 32) {
      if (bytes.size > 33 || bytes[0] != 0x0.toByte()) { throw Error("bnToBytes: invalid bytes") }
      return bytes.copyOfRange(1, bytes.size)
    }
    val out = ByteArray(32)
    bytes.copyInto(out, 32 - bytes.size)
    return out
  }

  @ReactMethod
  fun generateKeyPair(promise: Promise)  {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.reject("ERR_VERSION", "Android version must be 26 or higher to use this feature")
      return
    }
    try {
      val keyPairGen = KeyPairGenerator.getInstance("EC")
      keyPairGen.initialize(ECGenParameterSpec(ecStdName))
      val key = keyPairGen.generateKeyPair()

      val privKey = key.private as java.security.interfaces.ECPrivateKey
      val privKeyBytes = bnToBytes(privKey.s)
      val privKeyStr = Base64.getUrlEncoder()
        .encodeToString(privKeyBytes)
        .trimEnd('=')


      val pubKey = key.public as java.security.interfaces.ECPublicKey
      val pubKeyBytes = ByteArray(65)
      pubKeyBytes[0] = 0x04.toByte()
      bnToBytes(pubKey.w.affineX).copyInto(pubKeyBytes, 1)
      bnToBytes(pubKey.w.affineY).copyInto(pubKeyBytes, 33)
      val pubKeyStr = Base64.getUrlEncoder()
        .encodeToString(pubKeyBytes)
        .trimEnd('=')

      val map: WritableMap = WritableNativeMap()
      map.putString("privateKey", privKeyStr)
      map.putString("publicKey", pubKeyStr)
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun generateAuthSecret(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.reject("ERR_VERSION", "Android version must be 26 or higher to use this feature")
      return
    }
    try {
      val rd = SecureRandom()
      val auth = ByteArray(16)
      rd.nextBytes(auth)
      val authStr = Base64.getUrlEncoder()
        .encodeToString(auth)
        .trimEnd('=')
      promise.resolve(authStr)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }


  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun decryptMessage(
    msg: String,
    privKey: String,
    pubKey: String,
    auth: String,
    promise: Promise
  ) {
    try {
      val decoder = Base64.getDecoder()
      val msgBytes = decoder.decode(msg)

      val urlsafeDecoder = Base64.getUrlDecoder()
      val privKeyBytes = urlsafeDecoder.decode(privKey)
      val pubKeyBytes = urlsafeDecoder.decode(pubKey)
      val authBytes = urlsafeDecoder.decode(auth)
      val decrypted = decryptHKDF(msgBytes, privKeyBytes, pubKeyBytes, authBytes)
        .dropLastWhile { it in listOf(0x00.toByte(), 0x02.toByte()) }
        .toByteArray()
      val decryptedString = String(decrypted, UTF8)
      println(decryptedString)
      promise.resolve(decryptedString)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @Throws(Exception::class)
  fun decryptAESGCM(
    cipherData: ByteArray?,
    key: SecretKey,
    nonce: ByteArray?,
    aad: ByteArray?
  ): ByteArray {
    // Get Cipher Instance
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")

    // Create SecretKeySpec
    val keySpec =
      SecretKeySpec(key.encoded, "AES")

    // Create GCMParameterSpec
    val gcmParameterSpec =
      GCMParameterSpec(128, nonce)

    // Initialize Cipher for DECRYPT_MODE
    cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmParameterSpec)
    if (aad != null) {
      // Update AAD to verify additional auth (Optional)
      cipher.updateAAD(aad)
    }

    // Perform Decryption
    return cipher.doFinal(cipherData)
  }

  private val hmacAlgo = "HmacSHA256"

  @Throws(Exception::class)
  fun hmacsha256(key: ByteArray?, buf: ByteArray?): ByteArray {
    val sk =
      SecretKeySpec(key, hmacAlgo)
    val mac = Mac.getInstance(hmacAlgo)
    mac.init(sk)
    return mac.doFinal(buf)
  }

  @Throws(Exception::class)
  fun expandHKDF(prk: ByteArray?, info: ByteArray?, length: Int): ByteArray {
    val mac = Mac.getInstance(hmacAlgo)
    mac.init(SecretKeySpec(prk, hmacAlgo))
    var t = ByteArray(0)
    var lastT = ByteArray(0)
    var counter = 1
    while (t.size < length) {
      mac.update(lastT)
      mac.update(info)
      mac.update(counter.toByte())
      lastT = mac.doFinal()
      t += lastT
      counter++
    }
    return t.copyOfRange(0, length)
  }

  private val SECRET_INFO_BYTES = "WebPush: info\u0000".toByteArray(UTF8)
  private val KEY_INFO_BYTES = "Content-Encoding: aes128gcm\u0000".toByteArray(UTF8)
  private val NONCE_INFO_BYTES = "Content-Encoding: nonce\u0000".toByteArray(UTF8)

  @Throws(Exception::class)
  fun decryptHKDF(
    buf: ByteArray?,
    privKey: ByteArray?,
    pubKey: ByteArray,
    auth: ByteArray?
  ): ByteArray {
    val kf = KeyFactory.getInstance("EC")

    val gps = ECGenParameterSpec(ecStdName) // NIST P-256
    val params = AlgorithmParameters.getInstance("EC")
    params.init(gps)
    val ecParameterSpec = params.getParameterSpec(ECParameterSpec::class.java)

    val privKeyInt = BigInteger(1, privKey)
    val myKeySpec = ECPrivateKeySpec(privKeyInt, ecParameterSpec)
    val myKey = kf.generatePrivate(myKeySpec)

    val bb = ByteBuffer.wrap(buf)
    val salt = ByteArray(16)
    bb[salt]
    bb.position(bb.position() + 4)
    val remoteKeyLen = java.lang.Byte.toUnsignedInt(bb.get())
    val remoteKeyBytes = ByteArray(remoteKeyLen)
    bb[remoteKeyBytes]
    val cipher = ByteArray(bb.remaining())
    bb[cipher]

    val remoteKeyX = BigInteger(1, remoteKeyBytes.copyOfRange(1, remoteKeyLen / 2 + 1))
    val remoteKeyY =
      BigInteger(1, remoteKeyBytes.copyOfRange(remoteKeyLen / 2 + 1, remoteKeyLen))
    val remoteKeyPoint = ECPoint(remoteKeyX, remoteKeyY)
    val remoteKeySpec = ECPublicKeySpec(remoteKeyPoint, ecParameterSpec)
    val remoteKey = kf.generatePublic(remoteKeySpec)

    val keyAgreement = KeyAgreement.getInstance("ECDH")
    keyAgreement.init(myKey)
    keyAgreement.doPhase(remoteKey, true)
    val sharedKey = keyAgreement.generateSecret()

    val secret = expandHKDF(
      hmacsha256(auth, sharedKey),
      SECRET_INFO_BYTES + pubKey + remoteKeyBytes,
      32
    )
    val prk = hmacsha256(salt, secret)
    val key = expandHKDF(prk, KEY_INFO_BYTES, 16)
    val nonceBytes = expandHKDF(prk, NONCE_INFO_BYTES, 12)
    val seckey: SecretKey = SecretKeySpec(key, 0, key.size, "AES")
    return decryptAESGCM(cipher, seckey, nonceBytes, null)
  }

}
