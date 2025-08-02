import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { atob } from "buffer";
import { NextApiRequest, NextApiResponse } from "next";
import { NextApiHandler } from "next";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "../../../../lib/prisma";
import { verifyPassword } from "../../../../lib/authHelper";
import { getCurrencySymbol } from "../../../../lib/getClientEnv";

const authHandler: NextApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => NextAuth(req, res, options);

export default authHandler;

export const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          let { username, password } = req.body as {
            username: string;
            password: string;
          };
          password = atob(password);

          // Find the user in the database
          const dbUser: any = await prisma.user.findFirst({
            where: {
              OR: [{ username: username }, { email: username }],
              deleted_status: false,
              active_status: true,
              user_to_role: {
                some: {
                  role: {
                    name: { in: ["Owner", "SuperAdmin", "BackOfficeUser"] },
                  },
                },
              },
            },
          });
          //if user does not exist, return null
          if (dbUser === null) {
            console.error("No user found for:", username);
            return null;
          }

          // Verify the password
          const passwordMatch = await verifyPassword(password, dbUser.password);

          // Update the last_login field
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { last_login: new Date() },
          });

          // Prepare the user object to return
          const user = {
            ...dbUser,
            name: dbUser.first_name + " " + dbUser.last_name,
            id: dbUser.id,
          };

          return user;
        } catch (error) {
          console.error("Error in user authorization:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
    updateAge: 30 * 60,
  },
  debug: process.env.ENV !== "PROD",
  adapter: PrismaAdapter(prisma),
  secret: process.env.SECRET,
  callbacks: {
    jwt: ({ token, user, profile, trigger, session }) => {
      return { ...token };
    },
    session: async ({ session, token }: any) => {
      const userData: any = await prisma.user.findUnique({
        where: { id: token.sub || "" },
        include: {
          user_to_role: {
            include: {
              role: true,
            },
          },
          accessrights: true,
        },
      });

      if (userData) {
        const roles = userData?.user_to_role.map((role: any) => role.role.name);
        const roleIds = userData?.user_to_role.map((role: any) => role.role.id);
        let client;
        let subscription_id;
        let next_payment_on;
        let billing_model;
        let shopper_reference;
        let currency;
        let currency_symbol;
        if (roles.includes("Owner")) {
          subscription_id = userData.subscription_id;
          next_payment_on = userData.next_payment_on;
          billing_model = userData.billing_model;
          shopper_reference = userData.shopper_reference;
        } else if (roles.includes("BackOfficeUser") && userData.client_id) {
          client = await prisma.user.findUnique({
            where: {
              id: userData.client_id,
            },
          });
          if (client) {
            subscription_id = client.subscription_id;
            next_payment_on = client.next_payment_on;
            billing_model = client.billing_model;
            shopper_reference = client.shopper_reference;
          }
        }
        const roleNavigations = await prisma.role_navigation.findMany({
          where: {
            role_id: {
              in: roleIds,
            },
          },
          include: {
            navigation: true,
          },
        });
        let subscription_navigations: any = [];
        if (
          subscription_id &&
          (roles?.includes("Owner") || roles?.includes("BackOfficeUser"))
        ) {
          subscription_navigations = await prisma.subscription_navigation.findMany(
            {
              where: {
                subscription_id: subscription_id,
              },
              include: {
                navigation: true,
              },
            }
          );
        }
        let navigations: any[] = [];
        if (roles?.includes("SuperAdmin")) {
          roleNavigations.map((roleNav:any) => {
            navigations.push(roleNav.navigation.href);
          });
        } else if (
          (roles?.includes("Owner") || roles?.includes("BackOfficeUser")) &&
          subscription_id
        ) {
          for (const rn of roleNavigations) {
            for (const sn of subscription_navigations) {
              if (rn.navigation.id === sn.navigation.id) {
                navigations.push(rn.navigation.href);
              }
            }
          }
        }

        // if (roles?.includes("BackOfficeUser")) {
        //   navigations = navigations.filter((nav) =>
        //     userData?.accessrights?.controls?.links
        //       ?.flatMap((link: any) =>
        //         link.items
        //           .filter((item: any) => item.view)
        //           .map((item: any) => item.href)
        //       )
        //       .includes(nav)
        //   );
        // }

        let locations: any[] = [];
        let selectedLocationId: any;

        if (roles?.includes("Owner") || roles.includes("BackOfficeUser")) {
          locations = await prisma.location.findMany({
            where: {
              deleted_status: false,
              client_id: roles.includes("Owner")
                ? userData.id
                : userData.client_id,
              ...(roles.includes("BackOfficeUser") && {
                id: {
                  in: userData.accessrights?.controls?.locations?.map(
                    (l: any) => l.location_id
                  ),
                },
              }),
            },
            orderBy: {
              created_at: "asc",
            },
          });

          let selected_location;
          if (locations?.length > 0 && userData.selected_location?.length > 0) {
            selected_location = userData.selected_location[0];
          }

          if (locations?.length > 0) {
            selectedLocationId = selected_location?.location_id
              ? selected_location.location_id
              : locations[0].id;
            if (!locations.map((c: any) => c.id).includes(selectedLocationId)) {
              selectedLocationId = locations[0]?.id || null;
            }
            await prisma.selected_location.upsert({
              where: {
                user_id: userData.id,
              },
              create: {
                user_id: userData.id,
                location_id: selectedLocationId,
              },
              update: {
                location_id: selectedLocationId,
              },
            });
          }

          if (selectedLocationId) {
            currency = locations.find((c: any) => c.id === selectedLocationId)
              .location_currency;
            currency_symbol = getCurrencySymbol(currency);
            locations = await prisma.location.findMany({
              where: {
                id: selectedLocationId,
                deleted_status: false,
                ...(roles.includes("BackOfficeUser") && {
                  id: {
                    in: userData.accessrights?.controls?.locations?.map(
                      (l: any) => l.location_id
                    ),
                  },
                }),
              },

              orderBy: {
                created_at: "asc",
              },
            });

            if (locations?.length > 0) {
              selectedLocationId = selected_location?.location_id
                ? selected_location.location_id
                : locations[0].id;
              if (
                !locations
                  .map((location: any) => location.id)
                  .includes(selectedLocationId)
              ) {
                selectedLocationId = locations[0].id;
              }
              await prisma.selected_location.upsert({
                where: {
                  user_id: userData.id,
                },
                create: {
                  user_id: userData.id,
                  location_id: selectedLocationId,
                },
                update: {
                  location_id: selectedLocationId,
                },
              });
            }
          }
        }

        const address = `${userData.street ? userData.street + ", " : ""}${
          userData.postcode ? userData.postcode + " " : ""
        }${userData.city ? userData.city : ""} ${
          userData.country ? userData.country : ""
        }`;
        let language_id;
        const languages = await prisma.translation_language.findMany({
          where: {
            deleted_status: false,
            active_status: true,
          },
        });
        const userLanguage = await prisma.user_translation_language.findFirst({
          where: {
            user_id: userData.id,
            translation_language_id: {
              in: languages.map((l:any) => l.id),
            },
          },
        });
        if (!userLanguage && languages?.length > 0) {
          const defaultLanguage = await prisma.user_translation_language.upsert(
            {
              where: {
                user_id: userData.id,
              },
              create: {
                user_id: userData.id,
                translation_language_id: languages[0].id,
              },
              update: {
                translation_language_id: languages[0].id,
              },
            }
          );
          language_id = defaultLanguage.id;
        } else if (userLanguage && languages?.length > 0) {
          language_id = userLanguage.translation_language_id;
        }
        let tutorials: any = [];

        session.user = {
          ...session.user,
          tutorials,
          address,
          roles,
          roleIds,
          id: userData.id,
          selected_location_id: selectedLocationId,
          image: userData.image,
          name: userData.first_name + " " + userData.last_name,
          password_changed: userData.password_changed,
          username: userData?.username,
          accessrights: userData.accessrights,
          locations,
          navigation: navigations,
          language_id,
          client_id: userData.client_id,
          subscription_id,
          next_payment_on,
          billing_model,
          shopper_reference,
          currency,
          currency_symbol,
        };
      }

      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/404",
  },
};
