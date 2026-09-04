declare module "bcryptjs" {
  interface Bcrypt {
    hash(value: string, rounds: number): Promise<string>;
    compare(value: string, hash: string): Promise<boolean>;
  }
  const bcrypt: Bcrypt;
  export default bcrypt;
}
