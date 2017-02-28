export interface UserInfo {
  sub: string;
  address: {
    formatted: string
  };
  name: string;
  phone_number: string;
  given_name: string;
  family_name: string;
  email: string;
}
