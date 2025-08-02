import * as React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Toolbar,
  TextField,
  InputAdornment,
  Button,
  Checkbox,
  FormControlLabel,
  TableHead,
} from "@mui/material";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

import { useTranslation } from "react-i18next";
import axios from "axios";
import { ToastSuccessMessage, ToastErrorMessage } from "@/components/common/ToastMessages";
import Loader from "../loader/Loader";
const RestrictionPage = () => {
  interface Roles {
    id: number;
    name: string;
  }

  const [navItems, setNavItems] = useState<any[]>([]);
  const [roles, setRoles] = useState<Roles[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loading, setLoading] = useState(true);
  const { push } = useRouter();
  const { data: session, status }: any = useSession({
    required: true,
    onUnauthenticated() {
      push("/admin/login");
    },
  });
  useEffect(() => {
    if (session && !session?.user.roles?.includes("SuperAdmin")) {
      push("/admin/dashboard");
    }
  }, [session]);
  const { t } = useTranslation();
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const getNavs = async () => {
    try {
      const response = await axios.post("/api/navigations/getnavigations");
      setNavItems(response.data.Navigations);
    } catch (error: any) {
      ToastErrorMessage(error)
    }
  };
  const getroles = async () => {
    try {
      const response = await axios.post("/api/navigations/getroles");
      setRoles(response.data.Roles);
    } catch (error: any) {
      ToastErrorMessage(error)
    }
  };

  const setup = async () => {
    setLoading(true);
    await getNavs();
    await getroles();
    setToInsert([]);
    setToDelete([]);
    setLoading(false);
  };
  useEffect(() => {
    setup();
  }, []);

  const [toInsert, setToInsert] = useState<Record<string, any>[]>([]);
  const [toDelete, setToDelete] = useState<Record<string, any>[]>([]);
  const handleCheckboxChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, checked } = event.target;
    const [navId, roleId] = name.split("-").map(Number);

    if (checked) {
      setToInsert((prev) => [...prev, { navId, roleId }]);
      setToDelete((prev) =>
        prev.filter((item) => !(item.navId === navId && item.roleId === roleId))
      );
    } else {
      setToDelete((prev) => [...prev, { navId, roleId }]);
      setToInsert((prev) =>
        prev.filter((item) => !(item.navId === navId && item.roleId === roleId))
      );
    }
  };
  const [filterednavItems, setFilterednavItems] = useState<
    Record<string, any>[]
  >([]);
  const [filteredRoles, setFilteredRoles] = useState<Record<string, any>[]>([]);
  useEffect(() => {
    if (session?.user.roles?.includes("SuperAdmin")) {
      setFilterednavItems(
        navItems.filter((nav) =>
          nav?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilterednavItems(
        navItems.filter(
          (nav) =>
            !["admin users", "partners"].includes(nav?.title?.toLowerCase()) &&
            nav?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (session?.user.roles?.includes("SuperAdmin")) {
      setFilteredRoles(
        roles.filter((role) =>
          role?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredRoles(
        roles.filter(
          (role) =>
            ![1, 5, 6].includes(role?.id) &&
            role?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [navItems, session, roles]);
  const updateNavigation = async () => {
    try {
      const response = await axios.post("/api/navigations/updatenavigation", {
        toInsert,
        toDelete,
      });
      ToastSuccessMessage(response?.data?.message || "updated!")
      setup();
    } catch (error: any) {
      ToastErrorMessage(error)
    }
  };
  return (
    <div>
      {loading ? (
        <Loader loading={loading} />
      ) : (
        <>
          <Toolbar>
            <Box sx={{ flex: "1 1 100%" }}>
              <TextField
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size="1.1rem" />
                    </InputAdornment>
                  ),
                }}
                placeholder={t("search_navigation") ?? ""}
                size="small"
                onChange={handleSearch}
                value={searchTerm}
                type="text"
              />
            </Box>
            <Button onClick={updateNavigation} variant="contained">
              {t("save")}
            </Button>
            <Button
              onClick={setup}
              variant="contained"
              color="error"
              sx={{ marginX: 1 }}
            >
              {t("cancel")}
            </Button>
          </Toolbar>
          <Table
            aria-label="a dense table"
            size="small"
            sx={{
              width: "100%",
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>{t("navigation")}</TableCell>
                {filteredRoles.map((role) => (
                  <TableCell key={role.id}>{role.name}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filterednavItems.map((nav) => (
                <TableRow key={nav.id}>
                  <TableCell>
                    {t(
                      nav.title
                        .toLowerCase()
                        .replace(/ /g, "_")
                        .replace(/[^\w\s]/g, "")
                    )}
                  </TableCell>
                  {filteredRoles.map((role) => (
                    <TableCell key={`${role.id}_${nav.id}`}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={
                              (nav.role_navigation.filter(
                                (x: Record<string, any>) =>
                                  x.role_id === role.id
                              ).length > 0 &&
                                toDelete?.filter(
                                  (x) =>
                                    x.roleId === role.id && x.navId === nav.id
                                ).length === 0) ||
                              toInsert?.filter(
                                (x) =>
                                  x.roleId === role.id && x.navId === nav.id
                              ).length > 0
                            }
                            onChange={handleCheckboxChange}
                            name={`${nav.id}-${role.id}`}
                            disabled={
                              role.name === "SuperAdmin" &&
                              (nav.title === "Role Management" ||
                                nav.title === "Subscription Management")
                            }
                          />
                        }
                        label={undefined}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
};

export default RestrictionPage;
