import React, { useEffect } from "react";
import { Formik, Field, Form } from "formik";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Button,
  Box,
  ListSubheader,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

const FilterDrop = () => {
  const [sections, setSections] = React.useState<
    { id: number; name: string }[]
  >([]);
  const [categories, setCategories] = React.useState<
    { id: number; name: string; section_id: number }[]
  >([]);
  const [products, setProducts] = React.useState<
    { id: number; name: string; category_id: number }[]
  >([]);

  // States for search filter
  const [sectionSearch, setSectionSearch] = React.useState("");
  const [categorySearch, setCategorySearch] = React.useState("");
  const [productSearch, setProductSearch] = React.useState("");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sectionsResponse = await axios.post(
          "/api/menu/section/all_section"
        );
        setSections(sectionsResponse.data.sections);

        const categoriesResponse = await axios.post(
          "/api/menu/category/allcategories"
        );
        setCategories(categoriesResponse.data.categories);

        const productsResponse = await axios.post(
          "/api/menu/category/allproduct"
        );
        setProducts(productsResponse.data.products);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  // Create Formik initial values
  const initialValues = {
    selectedSection: "",
    selectedCategories: [] as number[], // Array of category ids
    selectedProducts: {} as {
      [categoryId: number]: { productId: number; categoryId: number }[];
    },
  };

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      const { selectedSection, selectedCategories, selectedProducts } = values;

      if (!selectedSection) {
        alert("Please select a section");
        return;
      }

      const selectedCategoriesData = categories.filter((category) =>
        selectedCategories.includes(category.id)
      );

      const selectedData = {
        section: sections.find(
          (section) => section.id === (selectedSection as any)
        ),
        categories: selectedCategoriesData.map((category) => ({
          category: category,
          products: selectedProducts[category.id] || [],
        })),
      };

      if (!selectedData.section) {
        alert("No section selected.");
        return;
      }

      console.log("Request Data to Submit:", {
        selectedSection: selectedData.section.id,
        selectedProducts: selectedData.categories.flatMap((category) =>
          category.products.map((prod) => ({
            productId: prod.productId,
            categoryId: category.category.id,
          }))
        ),
      });

      const requestData = {
        selectedSection: selectedData.section.id,
        selectedProducts: selectedData.categories.flatMap((category) =>
          category.products.map((product) => ({
            productId: product.productId,
            categoryId: category.category.id,
          }))
        ),
      };

      const response = await axios.post(
        "/api/menu/category/combo",
        requestData
      );
      console.log(response.data);
      alert("Data saved successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("An error occurred while saving the data.");
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue }) => (
        <Form>
          {/* Section Dropdown with Search Bar */}
          <FormControl sx={{ m: 1, minWidth: 200 }}>
            <InputLabel id="section-select-label">Select Section</InputLabel>
            <Field
              as={Select}
              name="selectedSection"
              labelId="section-select-label"
              id="section-select"
              value={values.selectedSection}
              label="Select Section"
              onChange={(e: React.ChangeEvent<{ value: unknown }>) => {
                const selectedValue = e.target.value as string;
                setFieldValue("selectedSection", selectedValue);
                setFieldValue("selectedCategories", []); // Reset categories
                setFieldValue("selectedProducts", {}); // Reset selected products
              }}
              required
            >
              {/* Section Search Field */}
              <TextField
                fullWidth
                variant="outlined"
                label="Search Sections"
                size="small"
                sx={{ marginBottom: "8px" }}
                value={sectionSearch}
                onChange={(e) => setSectionSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Filter sections based on search term */}
              {sections
                .filter((section) =>
                  section.name
                    .toLowerCase()
                    .includes(sectionSearch.toLowerCase())
                )
                .map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.name}
                  </MenuItem>
                ))}
            </Field>
          </FormControl>

          {/* Category Dropdown with Search Bar */}
          <FormControl sx={{ m: 1, minWidth: 200 }}>
            <InputLabel id="category-select-label">
              Select Categories
            </InputLabel>
            <Field
              as={Select}
              name="selectedCategories"
              labelId="category-select-label"
              id="category-select"
              multiple
              value={values.selectedCategories}
              label="Select Categories"
              onChange={(e: React.ChangeEvent<{ value: unknown }>) => {
                const { value } = e.target;
                setFieldValue("selectedCategories", value);
                setFieldValue("selectedProducts", {}); // Reset selected products
              }}
              disabled={!values.selectedSection}
            >
              {/* Category Search Field */}
              <TextField
                fullWidth
                variant="outlined"
                label="Search Categories"
                size="small"
                sx={{ marginBottom: "8px" }}
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {categories
                .filter(
                  (category) =>
                    (category.section_id === (values.selectedSection as any) ||
                      !values.selectedSection) &&
                    category.name
                      .toLowerCase()
                      .includes(categorySearch.toLowerCase())
                )
                .map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Checkbox
                      checked={values.selectedCategories.includes(category.id)}
                    />
                    <ListItemText primary={category.name} />
                  </MenuItem>
                ))}
            </Field>
          </FormControl>

          {/* Product Dropdown with Search Bar */}
          <FormControl sx={{ m: 1, minWidth: 200 }}>
            <InputLabel id="product-select-label">Select Products</InputLabel>
            <Field
              as={Select}
              name="selectedProducts"
              labelId="product-select-label"
              id="product-select"
              multiple
              value={[]}
              label="Select Products"
              renderValue={(selected: number[]) => {
                const selectedProductNames = Object.values(
                  values.selectedProducts
                )
                  .flat()
                  .map((product) => {
                    const prod = products.find(
                      (p) => p.id === product.productId
                    );
                    return prod ? prod.name : "";
                  })
                  .join(", ");
                return selectedProductNames;
              }}
              disabled={values.selectedCategories.length === 0}
            >
              {/* Product Search Field */}
              <TextField
                fullWidth
                variant="outlined"
                label="Search Products"
                size="small"
                sx={{ marginBottom: "8px" }}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {values.selectedCategories.map((categoryId) => {
                const category = categories.find(
                  (cat) => cat.id === categoryId
                );
                if (!category) return null;

                const filteredProducts = products.filter(
                  (product) =>
                    product.category_id === category.id &&
                    product.name
                      .toLowerCase()
                      .includes(productSearch.toLowerCase())
                );

                if (filteredProducts.length === 0) {
                  return (
                    <MenuItem key={category.id} disabled>
                      <ListSubheader>{category.name}</ListSubheader>
                      <MenuItem disabled>No products available</MenuItem>
                    </MenuItem>
                  );
                }

                return (
                  <div key={category.id}>
                    <ListSubheader>{category.name}</ListSubheader>
                    {filteredProducts.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        <Checkbox
                          checked={
                            values.selectedProducts[category.id]?.some(
                              (item) => item.productId === product.id
                            ) || false
                          }
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            const newSelectedProducts = {
                              ...values.selectedProducts,
                            };

                            if (!newSelectedProducts[category.id]) {
                              newSelectedProducts[category.id] = [];
                            }

                            const index = newSelectedProducts[
                              category.id
                            ].findIndex(
                              (item) => item.productId === product.id
                            );

                            if (index > -1) {
                              newSelectedProducts[category.id].splice(index, 1);
                            } else {
                              newSelectedProducts[category.id].push({
                                productId: product.id,
                                categoryId: category.id,
                              });
                            }

                            setFieldValue(
                              "selectedProducts",
                              newSelectedProducts
                            );
                          }}
                        />
                        <ListItemText primary={product.name} />
                      </MenuItem>
                    ))}
                  </div>
                );
              })}
            </Field>
          </FormControl>

          {/* Submit Button */}
          <Box sx={{ m: 2 }}>
            <Button variant="contained" color="primary" type="submit">
              Submit
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

export default FilterDrop;
