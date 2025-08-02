import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Badge,
  Box,
  SelectChangeEvent,
  Button,
} from '@mui/material';
import { useRouter } from "next/router";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import axios from 'axios';
import { useDispatch, useSelector } from '@/store/Store';
import { setSelectedLocation } from '@/store/SelectedLocationSlice';
import { t } from '../../../../lib/translationHelper';
import AdminLanguage from '@/layouts/full/vertical/header/AdminLanguage';

const navItems = [
  { id: 'home', name: 'home' },
  { id: 'categories', name: 'categories' },
  // { id: 'about', name: 'about' },
  { id: 'contactus', name: 'contact' },
  { id: 'faqs', name: 'faqs' },
];

type Props = {
  keys: { text: string; translation: string }[];
};

export default function Header({ keys }: Props) {
  const dispatch: any = useDispatch();
  const router = useRouter();
  const reservations = useSelector((state) => state.reservation).items;
  const cartCount = reservations?.length || 0;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState('home');
  const [locations, setLocations] = useState<any[]>([]);

  const handleClick = (id: string) => {
    setActiveId(id);
    setDrawerOpen(false);
  };

  const handleLocationChange = (event: SelectChangeEvent<string>) => {
    const selected = locations.find((loc) => loc.id === event.target.value);
    if (selected) {
      dispatch(setSelectedLocation(selected));
    }
  };

  useEffect(() => {
    const fetchAllLocations = async () => {
      try {
        const response = await axios.post('/api/location/fetchalllocations', {});
        const locs = response.data.locations || [];
        setLocations(locs);

        if (locs.length > 0) {
          dispatch(setSelectedLocation(locs[0]));
        }
      } catch (error) {
        console.error(t('error_while_fetching_locations', keys), error);
      }
    };
    fetchAllLocations();
  }, [dispatch, keys]);

  return (
    <AppBar position="fixed" color="default" className="shadow-md z-[1000]">
      <Box sx={{ marginX: { lg: "60px", xs: "10px" } }}>
        <Toolbar className="flex justify-between items-center px-4">
          <a href="#" className="flex-shrink-0">
            <img src="/images/logos/logo.svg" alt={t("logo", keys)} className="h-10" />
          </a>

          <>
          {router.pathname !== "/julietnails/category-services" && (
            <Box className="hidden sm:flex flex-1 justify-center space-x-6">
              {navItems.map(({ id, name }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`capitalize cursor-pointer ${activeId === id
                      ? "text-[#6E082F] font-semibold underline underline-offset-4"
                      : "text-black hover:text-[#6E082F]"
                    }`}
                  onClick={() => handleClick(id)}
                >
                  {t(name, keys)}
                </a>
              ))}
            </Box>
          )}
          </>

          <Box className="flex items-center space-x-4">
            {/* {locations.length > 0 && (
            <FormControl size="small" className="min-w-[160px]">
              <InputLabel id="select-location-label">Branch</InputLabel>
              <Select
                labelId="select-location-label"
                value={selectedLocation?.id || ''}
                onChange={handleLocationChange}
                label="Branch"
              >
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.location_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )} */}

            <IconButton
              aria-label={t("reservation", keys)}
              color="inherit"
              onClick={() =>
                router.push("/julietnails/appointments")
              }
            >
              <Badge badgeContent={cartCount} color="secondary">
                <EventIcon className="text-pink-700" />
              </Badge>
            </IconButton>
            <AdminLanguage height={6} width={6} />

            <div className="sm:hidden">
              <IconButton onClick={() => setDrawerOpen(true)} color="inherit" aria-label={t("open_menu", keys)}>
                <MenuIcon />
              </IconButton>
            </div>
          </Box>
        </Toolbar>

        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <div className="w-64 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-pink-600">{t("menu", keys)}</h3>
              <IconButton onClick={() => setDrawerOpen(false)} aria-label={t("close_menu", keys)}>
                <CloseIcon />
              </IconButton>
            </div>
            <List>
              {navItems.map(({ id, name }) => (
                <ListItem key={id} disablePadding>
                  <ListItemButton
                    component="a"
                    href={`#${id}`}
                    className={
                      activeId === id
                        ? 'bg-pink-100 text-pink-600 font-semibold rounded-lg'
                        : 'rounded-lg'
                    }
                    onClick={() => handleClick(id)}
                  >
                    <ListItemText primary={t(name, keys)} primaryTypographyProps={{ className: 'capitalize' }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </div>
        </Drawer>
      </Box>
    </AppBar>
  );
}
