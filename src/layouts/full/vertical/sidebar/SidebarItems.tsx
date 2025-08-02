import Menuitems from "./JulietNailsItems";
import { useRouter } from "next/router";
import { Box, List, useMediaQuery } from "@mui/material";
import { useDispatch, useSelector } from "../../../../store/Store";
import NavItem from "./NavItem";
import NavCollapse from "./NavCollapse";
import { AppState } from "../../../../store/Store";
import { toggleMobileSidebar } from "../../../../store/customizer/CustomizerSlice";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { NavitemsType } from "../../../../../lib/NavigationHelper";
import useScreenWidth from "../../../../../utils/useScreenWidth";
import Loader from "@/components/loader/Loader";
import { uniqueId } from "lodash";
import { IconPointFilled } from "@tabler/icons-react";
import { ToastErrorMessage } from "@/components/common/ToastMessages";
import axios from "axios";

const SidebarItems = () => {
  const { asPath } = useRouter();
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const pathDirect = asPath;
  const customizer = useSelector((state: AppState) => state.customizer);
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
  const mdDown = useMediaQuery((theme: any) => theme.breakpoints.down("md"));
  const hideMenu: any = lgUp
    ? customizer.isCollapse && !customizer.isSidebarHover
    : "";
  const [navs, setNavs] = useState<NavitemsType[]>([]);
  const [openCollapseId, setOpenCollapseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);
  const handleClick = (collapseId: any) => {
    if (
      typeof collapseId === "string" ||
      typeof collapseId === "number" ||
      null
    ) {
      setOpenCollapseId((prevCollapseId) =>
        prevCollapseId == collapseId ? null : collapseId
      );
    }
  };
  const dispatch = useDispatch();
  const { data: session, status, update } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });
  const widthSize = useScreenWidth();

  useEffect(() => {
    navs.map((nav) => {
      if (
        nav?.children &&
        nav?.children?.some(
          (item) =>
            `/${item?.href?.split("/")[1]?.split("?")[0]}` ==
            `/${asPath.split("/")[1].split("?")[0]}`
        )
      ) {
        setOpenCollapseId(nav.id as any);
      }
    });
  }, [asPath, widthSize]);

  const router = useRouter();

  useEffect(() => {
    const handleStart = () => {
      setLoading(true);
    };

    const handleComplete = () => {
      setLoading(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  useEffect(() => {
    const populateNavigation = async () => {
      try {
        let userNavigtion: any = [];
        Menuitems.map((nav: any) => {
          if (nav.title.toLowerCase().trim() === "locations") {
            if (
              session?.user?.locations &&
              session?.user?.locations?.length > 0 &&
              (session?.user?.roles?.includes("Owner") ||
                session?.user?.roles?.includes("BackOfficeUser"))
            ) {
              const childrens: any = [];
              nav.children?.map((item: any) => {
                if (session?.user?.navigation?.includes(item.href)) {
                  childrens.push(item);
                }
              });
              userNavigtion.push({
                ...nav,
                children: [
                  ...childrens,
                  ...session?.user.locations.map((x) => ({
                    id: uniqueId(),
                    db_id: x.id,
                    title: x.location_name,
                    icon: IconPointFilled,
                    href: "#",
                    translate: false,
                    is_location: true,
                    is_location_selected:
                      session.user.selected_location_id === x.id,
                  })),
                ],
              });
            }
          } else if (nav.title.toLowerCase().trim() === "locations") {
            const childrens: any = [];
            nav.children?.map((item: any) => {
              if (session?.user?.navigation?.includes(item.href)) {
                childrens.push(item);
              }
            });
            if (
              session?.user?.locations &&
              session?.user?.locations?.length > 0 &&
              (session?.user?.roles?.includes("Owner") ||
                session?.user?.roles?.includes("BackOfficeUser"))
            ) {
              childrens.push(
                ...session?.user?.locations?.map((x) => ({
                  id: uniqueId(),
                  title: x.location_name,
                  db_id: x.id,
                  icon: IconPointFilled,
                  href: "#",
                  translate: false,
                  is_location: true,
                  is_location_selected:
                    session.user.selected_location_id === x.id,
                }))
              );
            }
            if (
              session?.user?.roles?.includes("Owner") ||
              session?.user?.roles?.includes("BackOfficeUser")
            ) {
              userNavigtion.push({
                ...nav,
                children: childrens,
              });
            }
          } else if (
            nav.title === "Location" &&
            session?.user?.roles?.includes("SuperAdmin")
          ) {
          } else if (
            (nav.href === "/modifiers" || nav.href === "/receipts") &&
            (session?.user?.roles?.includes("Owner") ||
              session?.user?.roles?.includes("BackOfficeUser"))
          ) {
          } else {
            if (nav.href === "#" && nav?.children?.length > 0) {
              const childrens: any = [];
              nav.children?.map((item: any) => {
                if (
                  item.href === "/modifiers" &&
                  session?.user?.roles?.includes("SuperAdmin")
                ) {
                } else if (session?.user?.navigation?.includes(item.href)) {
                  childrens.push(item);
                }
              });
              if (childrens.length > 0) {
                userNavigtion.push({
                  ...nav,
                  children: childrens,
                });
              }
            } else if (
              nav.href !== "#" &&
              session?.user?.navigation?.includes(nav.href)
            ) {
              userNavigtion.push(nav);
            }
          }
        });
        setNavs(userNavigtion);
      } catch (error) {
        ToastErrorMessage(error);
      }
    };

    populateNavigation();
  }, []);

  const updateSession = async (entity: string, is_location: boolean) => {
    try {
      let payload = {};
      if (is_location) {
        payload = {
          location_id: entity,
        };
      } 
      await axios.post("/api/users/updateselectedlocation", payload);
      window.location.reload();
    } catch (error) {
      ToastErrorMessage(error);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "sidebar" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [languageUpdate]);
  return (
    <Box sx={{ px: 2 }}>
      <Loader loading={loading} />
      <List sx={{ pt: 0 }} className="sidebarNav">
        {navs.map((item) => {
          if (item.children) {
            return (
              <NavCollapse
                keys={keys}
                menu={item}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                pathWithoutLastPart={asPath}
                level={1}
                key={item.id}
                onClick={handleClick}
                isOpen={openCollapseId === item.id}
                openCollapseId={openCollapseId}
                updateSession={updateSession}
              />
            );
          } else {
            return (
              <NavItem
                item={item}
                key={item.id}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                keys={keys}
                onClick={() => {
                  dispatch(toggleMobileSidebar());
                  setOpenCollapseId(null);
                }}
                onEntityClick={(input, is_location) => {
                  updateSession(input, is_location);
                }}
              />
            );
          }
        })}
      </List>
    </Box>
  );
};
export default SidebarItems;
