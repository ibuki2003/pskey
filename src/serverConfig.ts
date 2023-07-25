import React from "react";
import storage from "@/storage";

export interface ServerConfig {
  // meta
  domain: string;
  name: string;
  iconUrl: string;
  lastUsedAt: number; // timestamp

  userScripts: string[];
}

type MisskeyMeta = {
  name: string;
  iconUrl: string;
};

const SERVERS_KEY = "servers";

function fixServerConfig(serverConfig: Partial<ServerConfig>): ServerConfig {
  serverConfig.lastUsedAt ??= Date.now();

  if (!("userScripts" in serverConfig)) {
    serverConfig.userScripts = [];
  }

  return serverConfig as ServerConfig;
}

async function loadServers(): Promise<ServerConfig[]> {
  return (await storage.getAllDataForKey(SERVERS_KEY)).map(fixServerConfig);
}

async function fetchServerInfo(domain: string) {
  const metadata = (await fetch(`https://${domain}/api/meta`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ detail: false }),
  }).then((res) => res.json())) as MisskeyMeta;

  return {
    domain,
    name: metadata.name,
    iconUrl: metadata.iconUrl,
  };
}

async function saveServer(domain: string, server: ServerConfig) {
  await storage.save({
    key: SERVERS_KEY,
    id: domain,
    data: server,
  });
}

async function removeServer(domain: string) {
  await storage.remove({ key: SERVERS_KEY, id: domain });
}

export function useServers() {
  const [servers] = React.useState(() => new Map<string, ServerConfig>());
  function lastServerId() {
    if (servers.size === 0) return null;
    return Array.from(servers).reduce<[string, { lastUsedAt: number }]>(
      (a, b) => (a[1].lastUsedAt > b[1].lastUsedAt ? a : b),
      ["", { lastUsedAt: 0 }]
    )[0];
  }

  const [selected, setSelectedServer] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(() => {
    loadServers().then((s) => {
      // setServers(servers.map((server) => server.name));
      servers.clear();
      s.forEach((server) => servers.set(server.domain, server));
      setSelectedServer(lastServerId());

      setLoading(false);
    });
    return true;
  });

  const add = React.useCallback(
    async (domain: string) => {
      const server = fixServerConfig(await fetchServerInfo(domain));
      servers.set(domain, server);
      saveServer(domain, server);
      setSelectedServer(domain);
    },
    [setSelectedServer]
  );

  const remove = React.useCallback(
    async (domain: string) => {
      servers.delete(domain);
      await removeServer(domain);
      setSelectedServer(lastServerId());
    },
    [setSelectedServer]
  );

  const update = React.useCallback(
    async (domain: string, config: ServerConfig) => {
      if (!servers.has(domain)) return;
      const n = { ...servers.get(domain)!, ...config };
      servers.set(domain, n);
      saveServer(domain, n);
    },
    [setSelectedServer]
  );

  const select = React.useCallback(
    (domain: string) => {
      setSelectedServer(domain);
      update(domain, { ...servers.get(domain)!, lastUsedAt: Date.now() });
    },
    [setSelectedServer, update]
  );

  React.useEffect(() => {
    // refetch server info
    if (selected === null || !servers.has(selected)) return;
    fetchServerInfo(selected).then((info) => {
      update(selected, {
        ...servers.get(selected)!,
        ...info,
      });
    });
  }, [selected]);

  return {
    servers,
    loading,
    selected,
    add,
    remove,
    update,
    select,
  };
}
