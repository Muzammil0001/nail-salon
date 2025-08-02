import {
    Box, Card, CardContent, Typography, Button,
    CardMedia, CardActions, TextField, InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { ToastErrorMessage } from "@/components/common/ToastMessages";
import { useRouter } from "next/router";
import Loader from "@/components/loader/Loader";
import { t } from "../../../../lib/translationHelper";
import { useSelector } from "@/store/Store";

type HeaderProps = {
    keys: { text: string; translation: string }[];
};

interface Category {
    id: string;
    name: string;
    image: string;
    description: string;
    active_status: boolean;
}

export default function CategoriesSection({ keys }: HeaderProps) {
    const selectedLocation: any = useSelector((state) => state.selectedLocation).selectedLocation;
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleCount, setVisibleCount] = useState(8);

    const filteredCategories = categories?.filter(
        (cat) =>
            cat.active_status &&
            (cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );


    useEffect(() => {
        const fetchCategories = async () => {

            if (!selectedLocation?.id) return;
            try {
                setLoading(true);
                const payload = {
                    location_id: selectedLocation.id,
                    fetchAll: true,
                };
                const response = await axios.post("/api/category/fetchcategories", payload);
                const result = response.data.data;
                setCategories(result);
            } catch (error) {
                ToastErrorMessage(error);
            } finally {
                setLoading(false);
            }
        }
        fetchCategories();
    }, [selectedLocation]);

    const debouncedSearch = useMemo(
        () =>
            debounce((value: string) => {
                setSearchTerm(value);
            }, 300),
        []
    );

    const handleViewMore = () => setVisibleCount((prev) => prev + 4);
    const handleViewLess = () => setVisibleCount(8);


    return (
        <section id="categories" className="snap-start my-12 p-4 lg:p-6 bg-white">
            <Loader loading={loading} />
            <Box sx={{ margin: { lg: "60px", xs: "10px" } }}>
                <h2 className="text-3xl font-bold mb-8 text-center text-slate-800">
                    {t("our_categories", keys)}
                </h2>

                <div className="w-full max-w-md mx-auto mb-10 text-center">
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder={t("search_by_name_or_description", keys)}
                        onChange={(e) => debouncedSearch(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </div>

                {filteredCategories.length === 0 ? (
                    <Typography variant="h6" color="text.secondary" className="text-center mt-12">
                        {t("no_categories_found", keys)}
                    </Typography>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredCategories.slice(0, visibleCount).map((cat) => (
                                <Card
                                    key={cat.id}
                                    sx={{
                                        width: "100%",
                                        borderRadius: 1,
                                        boxShadow: 3,
                                        transition: "0.2s",
                                        "&:hover": {
                                            boxShadow: 6,
                                            transform: "translateY(-3px)",
                                        },
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        sx={{ borderRadius: "10px", height: "160px" }}
                                        image={
                                            `${process.env.NEXT_PUBLIC_IMG_DIR}${cat?.image}` ||
                                            `${process.env.NEXT_PUBLIC_IMG_DIR}placeholder.svg`
                                        }
                                        alt={cat.name}
                                    />
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight={600} color="primary">
                                            {cat.name}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            title={cat.description}
                                            sx={{
                                                mt: 0.5,
                                                fontSize: "0.8rem",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "normal",
                                            }}
                                        >
                                            {cat.description}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ px: 2, pb: 2 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            sx={{ borderRadius: 0 }}
                                            onClick={() => cat.id && router.push(`/julietnails/category-services?id=${cat.id}`)}
                                        >
                                            {t("see_services", keys)}
                                        </Button>
                                    </CardActions>
                                </Card>
                            ))}
                        </div>

                        {(visibleCount < filteredCategories.length || visibleCount > 8) && (
                            <div className="text-center mt-8 flex flex-col sm:flex-row justify-center gap-4">
                                {visibleCount < filteredCategories.length && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleViewMore}
                                        sx={{ borderRadius: 0, px: 4, py: 1.5, textTransform: "none" }}
                                    >
                                        {t("view_more", keys)}
                                    </Button>
                                )}
                                {visibleCount > 8 && (
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={handleViewLess}
                                        sx={{ borderRadius: 0, px: 4, py: 1.5, textTransform: "none" }}
                                    >
                                        {t("view_less", keys)}
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </Box>
        </section>
    );
}
