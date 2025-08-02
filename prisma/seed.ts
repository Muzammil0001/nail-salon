import { hashPassword } from "../lib/authHelper";
import { translationPages } from "../lib/pages";
import prisma from "../lib/prisma";
import moment from "moment-timezone";
import { formatTime } from "../utils/scheduleUtils";

async function main() {
  const roles = [
    {
      name: "SuperAdmin",
      description: "SuperAdmin",
    },
    {
      name: "Owner",
      description: "Owner",
    },
    {
      name: "BackOfficeUser",
      description: "Back Office User",
    },
    {
      name: "Staff",
      description: "Staff User",
    },
  ];

  const navs = [
    {
      title: "location_overview",
      href: "/admin/locations-overview",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "sites",
      href: "/admin/sites",
      roles: ["SuperAdmin"],
    },
    {
      title: "dashboard",
      href: "/admin/dashboard",
      roles: ["Owner", "BackOfficeUser"],
    },
    // {
    //   title: "configuration",
    //   href: "/admin/configuration",
    //   roles: ["SuperAdmin"],
    // },

    // {
    //   title: "app_versions",
    //   href: "/admin/appversions",
    //   roles: ["SuperAdmin"],
    // },

    // {
    //   title: "receipt_templates",
    //   href: "/admin/receipts",
    //   roles: ["Owner", "BackOfficeUser"],
    // },
    {
      title: "appointments",
      href: "/admin/appointments",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "categories",
      href: "/admin/categories",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "turn_tracker",
      href: "/admin/turn-tracker",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "active_requests",
      href: "/admin/active-requests",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "service_management",
      href: "/admin/service-management",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "payroll",
      href: "/admin/payroll",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "orders",
      href: "/admin/orders",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "user_services",
      href: "/admin/user-services",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "Gift Cards",
      href: "/admin/benefits/gift-cards",
      roles: ["Owner","BackOfficeUser"],
    },
    {
      title: "services",
      href: "/admin/services",
      roles: ["Owner", "BackOfficeUser"],
    },
    // {
    //   title: "receipt_templates",
    //   href: "/admin/receipt-templates",
    //   roles: ["SuperAdmin"],
    // },
    {
      title: "activity_logs",
      href: "/admin/activity-logs",
      roles: ["SuperAdmin"],
    },
    {
      title: "devices",
      href: "/admin/devices",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "users",
      href: "/admin/users",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "sites",
      href: "/admin/sites",
      roles: ["SuperAdmin"],
    },
    // {
    //   title: "scheduling",
    //   href: "/admin/scheduling",
    //   roles: ["Owner", "BackOfficeUser"],
    // },
    // {
    //   title: "shift_management",
    //   href: "/admin/shift-management",
    //   roles: ["Owner", "BackOfficeUser"],
    // },
    // {
    //   title: "plans",
    //   href: /adminplans",
    //   roles: ["Owner", "BackOfficeUser"],
    // },
    {
      title: "staff_app",
      href: "/admin/staffapp",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "role_management",
      href: "/admin/roles",
      roles: ["SuperAdmin"],
    },
    {
      title: "subscription_management",
      href: "/admin/subscriptionNavigation",
      roles: ["SuperAdmin"],
    },
    {
      title: "clients",
      href: "/admin/clients",
      roles: ["SuperAdmin"],
    },
    {
      title: "loyalty",
      href: "/admin/loyalty",
      roles: ["Owner", "BackOfficeUser"],
    },
    {
      title: "subscription",
      href: "/admin/subscription",
      roles: ["SuperAdmin"],
    },
    {
      title: "admin_translations",
      href: "/admin/app-translation",
      roles: ["SuperAdmin"],
    },
    {
      title: "customers",
      href: "/admin/customers",
      roles: ["Owner", "BackOfficeUser"],
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
      },
    });
  }

  for (const nav of navs) {
    const navItem = await prisma.navigation.upsert({
      where: { title: nav.title },
      update: {
        title: nav.title,
        href: nav.href,
      },
      create: {
        title: nav.title,
        href: nav.href,
      },
    });

    for (const r of nav.roles) {
      let roleItem = await prisma.role.findFirst({
        where: { name: r },
      });
      if (!roleItem) {
        roleItem = await prisma.role.create({
          data: {
            name: r,
            description: r,
          },
        });
      }
      const navToRole = await prisma.role_navigation.findFirst({
        where: {
          navigation_id: navItem.id,
          role_id: roleItem.id,
        },
      });

      if (!navToRole) {
        await prisma.role_navigation.create({
          data: {
            navigation_id: navItem.id,
            role_id: roleItem.id,
          },
        });
      }
    }
  }

  const featureCodes = [
    { name: "Call Staff", code: "call_staff" },
    { name: "24/7 Online Support", code: "247_support" },
    { name: "Reservation", code: "reservation" },
    { name: "Online Payment", code: "online_payment" },
  ];

  for (const code of featureCodes) {
    await prisma.features.upsert({
      where: { code: code.code },
      update: { name: code.name },
      create: { name: code.name, code: code.code },
    });
  }

  const superAdminRole = await prisma.role.findFirst({
    where: { name: "SuperAdmin" },
  });
  const ownerRole = await prisma.role.findFirst({
    where: { name: "Owner" },
  });
  if (superAdminRole) {
    const user = await prisma.user.upsert({
      where: {
        username: "muzamal",
      },
      create: {
        email: "muzamal@gmail.com",
        username: "muzamal",
        password: await hashPassword("Mz123!"),
        phone: "+12342344234",
        user_main: false,
        first_name: "Mmmmm",
        last_name: "Admin",
        password_changed: true,
      },
      update: {
        email: "muzamal@gmail.com",
        username: "muzamal",
        password: await hashPassword("Mz123!"),
        phone: "+12342344234",
        user_main: false,
        first_name: "Mmmmm",
        last_name: "Admin",
      },
    });

    const existingMapping = await prisma.user_to_role.findFirst({
      where: {
        user_id: user.id,
        role_id: superAdminRole.id,
      },
    });

    if (!existingMapping) {
      await prisma.user_to_role.create({
        data: {
          user_id: user.id,
          role_id: superAdminRole.id,
        },
      });
    }
  }

  const languages = [
    {
      language_name: "English",
      language_code: "en-US",
    },
    {
      language_name: "Vietnamese",
      language_code: "vn",
    },
    {
      language_name: "Spanish",
      language_code: "es",
    },
    {
      language_name: "Bulgarian",
      language_code: "bg",
    },
    {
      language_name: "Czech",
      language_code: "cz",
    },
    {
      language_name: "Danish",
      language_code: "dk",
    },
    {
      language_name: "German",
      language_code: "de",
    },
    {
      language_name: "Greek",
      language_code: "gr",
    },
    {
      language_name: "Estonian",
      language_code: "ee",
    },
    {
      language_name: "Finnish",
      language_code: "fi",
    },
    {
      language_name: "French",
      language_code: "fr",
    },
    {
      language_name: "Irish",
      language_code: "ie",
    },
    {
      language_name: "Croatian",
      language_code: "hr",
    },
    {
      language_name: "Hungarian",
      language_code: "hu",
    },
    {
      language_name: "Italian",
      language_code: "it",
    },
    {
      language_name: "Lithuanian",
      language_code: "lt",
    },
    {
      language_name: "Latvian",
      language_code: "lv",
    },
    {
      language_name: "Maltese",
      language_code: "mt",
    },
    {
      language_name: "Dutch",
      language_code: "nl",
    },
    {
      language_name: "Polish",
      language_code: "pl",
    },
    {
      language_name: "Portuguese",
      language_code: "pt",
    },
    {
      language_name: "Romanian",
      language_code: "ro",
    },
    {
      language_name: "Slovak",
      language_code: "sk",
    },
    {
      language_name: "Slovenian",
      language_code: "si",
    },
    {
      language_name: "Swedish",
      language_code: "se",
    },
  ];

  for (const language of languages) {
    await prisma.languages.upsert({
      where: { language_code: language.language_code },
      update: {
        language_name: language.language_name,
        language_code: language.language_code,
      },
      create: {
        language_name: language.language_name,
        language_code: language.language_code,
      },
    });
  }
  const english = await prisma.languages.findUnique({
    where: { language_code: "en-US" },
  });
  const spanish = await prisma.languages.findUnique({
    where: { language_code: "es" },
  });
  const vietnamese = await prisma.languages.findUnique({
    where: { language_code: "vn" },
  });

  if (english && spanish && vietnamese) {
    let englishTranslation = await prisma.translation_language.findFirst({
      where: {
        language_id: english.id,
        deleted_status: false,
      },
    });
    let vietnameseTranslation = await prisma.translation_language.findFirst({
      where: {
        language_id: vietnamese.id,
        deleted_status: false,
      },
    });
    let spanishTranslation = await prisma.translation_language.findFirst({
      where: {
        language_id: spanish.id,
        deleted_status: false,
      },
    });

    if (!englishTranslation) {
      englishTranslation = await prisma.translation_language.create({
        data: {
          language_id: english.id,
        },
      });
    }
    if (!vietnameseTranslation) {
      vietnameseTranslation = await prisma.translation_language.create({
        data: {
          language_id: vietnamese.id,
        },
      });
    }
    if (!spanishTranslation) {
      spanishTranslation = await prisma.translation_language.create({
        data: {
          language_id: spanish.id,
        },
      });
    }

    for (const page of translationPages) {
      let translationPageEn = await prisma.translation_page.findFirst({
        where: {
          page_name: page.page_name,
          translation_language_id: englishTranslation.id,
        },
      });
      if (!translationPageEn) {
        translationPageEn = await prisma.translation_page.create({
          data: {
            page_name: page.page_name,
            translation_language_id: englishTranslation.id,
          },
        });
      }

      await prisma.translation_page_text.deleteMany({
        where: {
          translation_page_id: translationPageEn.id,
        },
      });

      if (page?.translation_page_text) {
        for (const text of page.translation_page_text) {
          await prisma.translation_page_text.create({
            data: {
              text: text.text,
              translation: text.en,
              translation_page_id: translationPageEn.id,
            },
          });
        }
      }

      let translationPageEs = await prisma.translation_page.findFirst({
        where: {
          page_name: page.page_name,
          translation_language_id: spanishTranslation.id,
        },
      });
      if (!translationPageEs) {
        translationPageEs = await prisma.translation_page.create({
          data: {
            page_name: page.page_name,
            translation_language_id: spanishTranslation.id,
          },
        });
      }

      await prisma.translation_page_text.deleteMany({
        where: {
          translation_page_id: translationPageEs.id,
        },
      });

      if (page?.translation_page_text) {
        for (const text of page.translation_page_text) {
          await prisma.translation_page_text.create({
            data: {
              text: text.text,
              translation: text.es,
              translation_page_id: translationPageEs.id,
            },
          });
        }
      }

      let translationPageVn = await prisma.translation_page.findFirst({
        where: {
          page_name: page.page_name,
          translation_language_id: vietnameseTranslation.id,
        },
      });
      if (!translationPageVn) {
        translationPageVn = await prisma.translation_page.create({
          data: {
            page_name: page.page_name,
            translation_language_id: vietnameseTranslation.id,
          },
        });
      }

      await prisma.translation_page_text.deleteMany({
        where: {
          translation_page_id: translationPageVn.id,
        },
      });

      if (page?.translation_page_text) {
        for (const text of page.translation_page_text) {
          await prisma.translation_page_text.create({
            data: {
              text: text.text,
              translation: text?.vn,
              translation_page_id: translationPageVn.id,
            },
          });
        }
      }
    }
  }
  await Promise.all(
    [{ app_name: "Staff App" }, { app_name: "Customer App" }].map((app) =>
      prisma.app_names.upsert({
        where: { app_name: app.app_name },
        create: app,
        update: app,
      })
    )
  );

  if (ownerRole) {
    const allFeatures = await prisma.features.findMany();
    const allNavigations = await prisma.navigation.findMany();

    const existingSubscription = await prisma.subscriptions.findFirst({
      where: { name: "Premium Pro" },
    });

    let premiumSubscription;
    if (existingSubscription) {
      premiumSubscription = await prisma.subscriptions.update({
        where: { id: existingSubscription.id },
        data: {
          description: "All features included at no cost",
          price: 0,
          yearly_price: 0,
          max_devices: 9999,
          max_locations: 9999,
        },
      });
    } else {
      premiumSubscription = await prisma.subscriptions.create({
        data: {
          name: "Premium Pro",
          description: "All features included at no cost",
          price: 0,
          yearly_price: 0,
          max_devices: 9999,
          max_locations: 9999,
        },
      });
    }

    await prisma.subscription_features.deleteMany({
      where: { subscription_id: premiumSubscription.id },
    });

    await prisma.subscription_features.createMany({
      data: allFeatures.map((feature: any) => ({
        subscription_id: premiumSubscription.id,
        feature_id: feature.id,
      })),
      skipDuplicates: true,
    });

    const existingAssignments = await prisma.subscription_navigation.findMany({
      where: {
        subscription_id: premiumSubscription.id,
      },
    });

    const existingIds = new Set(
      existingAssignments.map(
        (item: any) => `${item.navigation_id}-${item.subscription_id}`
      )
    );

    const newAssignments = allNavigations
      .filter((nav: any) => !existingIds.has(`${nav.id}-${premiumSubscription.id}`))
      .map((nav: any) => ({
        navigation_id: nav.id,
        subscription_id: premiumSubscription.id,
      }));

    if (newAssignments.length > 0) {
      await prisma.subscription_navigation.createMany({
        data: newAssignments,
        skipDuplicates: true,
      });
    }

    const locationLanguage = await prisma.languages.findFirst({
      where: {
        deleted_status: false,
        language_code: "en-US",
      },
    });

    const ownerUser = await prisma.user.upsert({
      where: {
        username: "owner",
      },
      create: {
        email: "iamowner@gmail.com",
        username: "owner",
        password: await hashPassword("password123"),
        phone: "+1000000000",
        user_main: true,
        country: "United States",
        street: "123 Main St",
        city: "New York",
        postcode: "10001",
        state: "NY",
        first_name: "Mmmm",
        last_name: "User",
        password_changed: true,
        billing_model: "UNLIMITED",
        subscription_id: premiumSubscription.id,
        next_payment_on: null,
        location_id: null,
        client_id: null,
        pin: "125125",
      },
      update: {
        email: "iamowner@gmail.com",
        username: "owner",
        password: await hashPassword("password123"),
        phone: "+1000000000",
        user_main: true,
        first_name: "Mmmm",
        last_name: "User",
        country: "United States",
        street: "123 Main St",
        city: "New York",
        postcode: "10001",
        state: "NY",
        billing_model: "UNLIMITED",
        subscription_id: premiumSubscription.id,
        next_payment_on: null,
        location_id: null,
        client_id: null,
        pin: "125125",
      },
    });

    await prisma.staff_accessrights.upsert({
      where: { user_id: ownerUser.id },
      update: {
        can_take_cash: true,
        can_take_card: true,
        can_make_reservation: true,
        can_edit_reservation: true,
        can_cancel_reservation: true,
        can_view_sales: true,
        can_view_customers: true,
        can_manage_profile: true,
        can_view_activity_logs: true,
        can_view_settings: true,
      },
      create: {
        user_id: ownerUser.id,
        can_take_cash: true,
        can_take_card: true,
        can_make_reservation: true,
        can_edit_reservation: true,
        can_cancel_reservation: true,
        can_view_sales: true,
        can_view_customers: true,
        can_manage_profile: true,
        can_view_activity_logs: true,
        can_view_settings: true,
      },
    });

    const existingMapping = await prisma.user_to_role.findFirst({
      where: {
        user_id: ownerUser.id,
        role_id: ownerRole.id,
      },
    });

    if (!existingMapping) {
      await prisma.user_to_role.create({
        data: {
          user_id: ownerUser.id,
          role_id: ownerRole.id,
        },
      });
    }

    const days = [
      { name: "sunday", active_status: false },
      { name: "monday", active_status: true },
      { name: "tuesday", active_status: true },
      { name: "wednesday", active_status: true },
      { name: "thursday", active_status: true },
      { name: "friday", active_status: true },
      { name: "saturday", active_status: true },
    ];


    await prisma.location.upsert({
      where: {
        location_number: "LOC001",
      },
      update: {
        location_name: "Main Branch",
        location_timezone: "America/New_York",
        location_24_hours: false,
        location_number: "LOC001",
        location_currency: "USD",
        country: "United States",
        street: "123 Main St",
        city: "New York",
        postcode: "10001",
        state: "NY",
        latitude: "40.7128",
        longitude: "-74.0060",
        location_email: "mmmm@gamil.com",
        location_phone: "+19483517344",
        tip_enabled: true,
        language_id: locationLanguage?.id,
        client_id: ownerUser.id,
        languagesId: null,
        location_schedule: {
          deleteMany: {},
          create: days
            .filter((day) => day.active_status)
            .map((day) => ({
              schedule_day: day.name,
              active_status: true,
              schedule_from: formatTime("08:00"),
              schedule_to: formatTime("20:00"),
            })),
        },
      },
      create: {
        location_name: "Main Branch",
        location_timezone: "America/New_York",
        location_24_hours: false,
        location_number: "LOC001",
        location_currency: "USD",
        language_id: locationLanguage?.id,
        country: "United States",
        street: "123 Main St",
        city: "New York",
        postcode: "10001",
        state: "NY",
        latitude: "40.7128",
        longitude: "-74.0060",
        location_email: "mmmm@gamil.com",
        location_phone: "+19483517344",
        tip_enabled: true,
        client_id: ownerUser.id,
        languagesId: null,
        location_schedule: {
          create: days
            .filter((day) => day.active_status)
            .map((day) => ({
              schedule_day: day.name,
              active_status: true,
              schedule_from: formatTime("08:00"),
              schedule_to: formatTime("20:00"),
            })),
        },
      },
      include: {
        location_schedule: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
