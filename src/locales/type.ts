import ja from "./ja";

type L<T> = { [K in keyof T]: T[K] extends string ? string : L<T[K]> };
type Locale = L<typeof ja>;
export default Locale;
