import React, { useEffect, useState } from 'react';
import { Box, Button } from '@mui/material';
import { useSession } from 'next-auth/react';
import Loader from '../loader/Loader';
import axios from 'axios';
import { ToastErrorMessage } from '../common/ToastMessages';
import { t } from "../../../lib/translationHelper";

interface Category {
  id: string;
  name: string;
}

const CategorySidebar = ({
  onSelectCategory,
  keys,
}: {
  onSelectCategory: (cat: string) => void;
  keys: any;
}) => {
  const { data: session } = useSession({ required: true });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const location_id = session?.user?.selected_location_id;
      if (!location_id) return;
      try {
        setLoading(true);
        const payload = {
          location_id,
          fetchAll: true,
        };
        const response = await axios.post("/api/category/fetchcategories", payload);
        const result = response.data.data;
        setCategories(result);

        if (result?.length > 0) {
          setSelectedCategory(result[0].id);
          onSelectCategory(result[0].id);
        }
      } catch (error) {
        ToastErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [session]);

  const handleSelect = (id: string) => {
    setSelectedCategory(id);
    onSelectCategory(id);
  };

  return (
    <>
      <Loader loading={loading} />
      <Box sx={{ width: 190, overflowY: 'auto', minHeight: '100vh' }}>
        {categories?.map((cat) => {
          const isSelected = cat.id === selectedCategory;

          return (
            <Button
            fullWidth
            key={cat.id}
            onClick={() => handleSelect(cat.id)}
            sx={{
              p: 2,
              mb: 1,
              justifyContent: 'flex-start',
              textTransform: 'capitalize',
              backgroundColor: isSelected ? 'primary.main' : 'white',
              color: isSelected ? 'white' : 'black',
              '&:hover': {
                backgroundColor: isSelected ? 'primary.dark' : '#000',
              },
            }}
            title={cat.name}
          >
            <span
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
              }}
            >
              {cat.name}
            </span>
          </Button>
          );
        })}
      </Box>
    </>
  );
};

export default CategorySidebar;
