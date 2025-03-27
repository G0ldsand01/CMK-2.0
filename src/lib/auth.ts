// import type { Session as BaseSession } from '@auth/core/types';

// export interface User {
//     id: string
//     name?: string | null
//     email?: string | null
//     image?: string | null
//   }
type BaseUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type CMKUser = BaseUser & {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
};

declare module '@auth/core/types' {
  interface Session {
    user: CMKUser;
  }

  interface User extends CMKUser {}
}
