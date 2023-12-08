// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: {
        id: string;
        isActive: Boolean;
        lastLogin: Date;
        username: String;
        profile: {
          id: string;
          dateOfHire: string;
          ennisId: Number;
          email?: string;
          firstName: string;
          lastName: string;
        };
      };
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {};
