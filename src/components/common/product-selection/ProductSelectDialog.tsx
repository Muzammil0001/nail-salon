import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  Autocomplete,
  TextField,
  Checkbox,
  Button,
  Grid,
} from "@mui/material";
import { t } from "../../../../lib/translationHelper";
import CustomFormLabel from "@/components/forms/theme-elements/CustomFormLabel";
import axios from "axios";
import { useSelector } from "@/store/Store";
import { set } from "lodash";
interface ModifierOption {
  id: string;
  name: string;
}

interface Modifiers {
  id: string;
  name: string;
  modifier_options: ModifierOption[];
}

interface Product {
  categoryName: string;
  id: string;
  name: string;
  price?: string;
  product_modifiers?: Modifiers[];
}

interface Category {
  sectionName: string;
  id: string;
  name: string;
  products: Product[];
}

interface Section {
  id: string;
  name: string;
  categories: Category[];
}

interface ProductSelectDialogProps {
  open: boolean;
  onClose: () => void;
  data: Section[];
  selectedSections: string[];
  selectedCategories: string[];
  selectedProducts: string[];
  selectedModifiers?: string[];
  setSelectedSections: (sections: string[]) => void;
  setSelectedCategories: (categories: string[]) => void;
  setSelectedProducts: (products: string[]) => void;
  setSelectedModifiers?: (modifiers: string[]) => void;
  onSave: () => void;
  modifiers?: boolean;
  isMultiSelect?: boolean;
}

const ProductSelectDialog: React.FC<ProductSelectDialogProps> = ({
  open,
  onClose,
  data,
  selectedSections,
  selectedCategories,
  selectedProducts,
  setSelectedSections,
  setSelectedCategories,
  setSelectedProducts,
  setSelectedModifiers,
  selectedModifiers,
  onSave,
  modifiers,
  isMultiSelect = true,
}) => {
  const languageUpdate = useSelector((state) => state.language.languageUpdate);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [keys, setKeys] = useState<{ text: string; translation: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.post(
          "/api/app-translation/fetchbypagename",
          { page_name: "products_selection_dialog" }
        );
        setKeys(response.data);
      } catch (error) {
        console.error("Error while fetching translation", error);
      }
    })();
  }, [languageUpdate]);

  const handleDiscard = () => {
    setIsDiscarding(true);
    setSelectedSections([]);
    setSelectedCategories([]);
    setSelectedProducts([]);
  };

  useEffect(() => {
    if (
      isDiscarding &&
      selectedSections.length === 0 &&
      selectedCategories.length === 0 &&
      selectedProducts.length === 0
    ) {
      onSave();
      onClose();
      setIsDiscarding(false);
    }
  }, [selectedSections, selectedCategories, selectedProducts, isDiscarding]);

  const selectedModifier = selectedProducts?.length
    ? data
      .flatMap((section) => section.categories)
      .flatMap((category) =>
        category.products.filter((product) =>
          selectedProducts.includes(product.id.toString())
        )
      )
      .flatMap((product) => product.product_modifiers || [])
    : [];

  const modifierOptions = selectedModifier.flatMap((modifier) =>
    modifier.modifier_options.map((option) => ({
      ...option,
      group: modifier.name,
    }))
  );

  const toggelSelectedItems = (array: string[]): string[] => {
    const frequency = array.reduce((acc: { [key: string]: number }, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

    return array.filter((item) => frequency[item] === 1);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          width: "70%",
          height: "80%",
        },
      }}
    >
      <DialogContent
        sx={{ height: "100%", overflowY: "auto", padding: "40px" }}
      >
        <Grid container spacing={3}>
          <Grid
            item
            xs={12}
            md={6}
            lg={modifiers ? 3 : 4}
            sx={{ flex: modifiers ? undefined : 1 }}
          >
            <CustomFormLabel sx={{ marginTop: "0px" }} required>
              {t("section", keys)}
            </CustomFormLabel>
            <Autocomplete
              multiple={isMultiSelect}
              options={data}
              className="capitalize"
              disableCloseOnSelect
              getOptionLabel={(option) => option.name}
              value={isMultiSelect
                ? data.filter((section) => selectedSections.includes(section.id))
                : data.find((section) => selectedSections.includes(section.id)) || null}
              onChange={(event, newValue) => {
                if (isMultiSelect) {
                  if (Array.isArray(newValue)) {
                    setSelectedSections(toggelSelectedItems(newValue.map((item) => item.id)));
                  }
                } else {
                  if (newValue) {
                    setSelectedSections([(newValue as any).id]);
                    setSelectedCategories([]);
                    setSelectedProducts([]);
                    setSelectedModifiers?.([]);
                  } else {
                    setSelectedSections([]);
                  }
                }
              }}
              renderGroup={(params) => (
                <div key={params.key}>
                  <div
                    style={{
                      textTransform: "capitalize",
                      fontWeight: "bold",
                      padding: "4px 8px",
                    }}
                  >
                    {params.group}
                  </div>
                  {params.children}
                </div>
              )}
              renderOption={(props, option) => (
                <li
                  {...props}
                  className="capitalize cursor-pointer hover:bg-slate-100 border-t flex items-center max-w-[500px]"
                >
                  <Checkbox
                    checked={selectedSections.includes(option.id)}
                    style={{ marginRight: 8 }}
                  />
                  <span className="break-words max-w-[200px]">
                    {option.name}
                  </span>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={`${!!selectedSections && selectedSections?.length > 0
                    ? ""
                    : t("choose_section", keys)
                    }`}
                />
              )}
            />
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            lg={modifiers ? 3 : 4}
            sx={{ flex: modifiers ? undefined : 1 }}
          >
            <CustomFormLabel sx={{ marginTop: "0px" }} required>
              {t("category", keys)}
            </CustomFormLabel>
            <Autocomplete
              multiple={isMultiSelect}
              disableCloseOnSelect
              className="capitalize"
              options={data
                .filter((section) => selectedSections.includes(section.id))
                .flatMap((section) =>
                  section.categories.map((category) => ({
                    ...category,
                    sectionName: section.name,
                  }))
                )}
              groupBy={(option) => option.sectionName}
              getOptionLabel={(option) => option.name}
              value={isMultiSelect
                ? data
                  .flatMap((section) => section.categories)
                  .filter((category) => selectedCategories.includes(category.id))
                : data
                  .flatMap((section) => section.categories)
                  .find((category) => selectedCategories.includes(category.id)) || null
              }
              onChange={(event, newValue) => {
                if (isMultiSelect) {
                  if (Array.isArray(newValue)) {
                    setSelectedCategories(toggelSelectedItems(newValue.map((item) => item.id)));
                  }
                } else {
                  if (newValue) {
                    setSelectedCategories([(newValue as any).id]);
                    setSelectedProducts([]);
                    setSelectedModifiers?.([]);
                  } else {
                    setSelectedCategories([]);
                  }
                }
              }}
              renderOption={(props, option) => (
                <li
                  {...props}
                  className="capitalize cursor-pointer hover:bg-slate-100 border-t flex items-center max-w-[500px]"
                >
                  <Checkbox
                    checked={selectedCategories.includes(option.id)}
                    style={{ marginRight: 8 }}
                  />
                  <span className="break-words max-w-[200px]">
                    {option.name}
                  </span>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                sx={{textTransform:"capitalize"}}
                  {...params}
                  placeholder={`${!!selectedCategories && selectedCategories?.length > 0
                    ? ""
                    : t("choose_category", keys)
                    }`}
                />
              )}
              disabled={selectedSections.length === 0}
            />
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            lg={modifiers ? 3 : 4}
            sx={{ flex: modifiers ? undefined : 1 }}
          >
            <CustomFormLabel sx={{ marginTop: "0px" }} required>
              {t("product", keys)}
            </CustomFormLabel>
            <Autocomplete
              multiple={isMultiSelect}
              disableCloseOnSelect
              className="capitalize"
              renderGroup={(params) => (
                <div key={params.key}>
                  <div
                    style={{
                      textTransform: "capitalize",
                      fontWeight: "bold",
                      padding: "4px 8px",
                    }}
                  >
                    {params.group}
                  </div>
                  {params.children}
                </div>
              )}
              options={data
                .flatMap((section) => section.categories)
                .filter((category) => selectedCategories.includes(category.id))
                .flatMap((category) =>
                  category.products.map((product) => ({
                    ...product,
                    categoryName: category.name,
                  }))
                )}
              groupBy={(option) => option.categoryName}
              getOptionLabel={(option) => option.name}
              value={isMultiSelect
                ? data
                  .flatMap((section) => section.categories)
                  .flatMap((category) => category.products)
                  .filter((product) => selectedProducts.includes(product.id))
                : data
                  .flatMap((section) => section.categories)
                  .flatMap((category) => category.products)
                  .find((product) => selectedProducts.includes(product.id)) || null
              }
              onChange={(event, newValue) => {
                if (isMultiSelect) {
                  if (Array.isArray(newValue)) {
                    setSelectedProducts(toggelSelectedItems(newValue.map((item) => item.id)));
                  }
                } else {
                  if (newValue) {
                    setSelectedProducts([(newValue as any).id]);
                  } else {
                    setSelectedProducts([]);
                  }
                }
              }}
              renderOption={(props, option) => (
                <li
                  {...props}
                  className="capitalize cursor-pointer hover:bg-slate-100 border-t flex items-center max-w-[500px]"
                >
                  <Checkbox
                    checked={selectedProducts.includes(option.id)}
                    style={{ marginRight: 8 }}
                  />
                  <span className="break-words max-w-[200px]">
                    {option.name}
                  </span>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                sx={{textTransform:"capitalize"}}
                  {...params}
                  placeholder={`${!!selectedProducts && selectedProducts?.length > 0
                    ? ""
                    : t("choose_product", keys)
                    }`}
                />
              )}
              disabled={selectedCategories.length === 0}
            />

          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            {modifiers && (
              <>
                <CustomFormLabel sx={{ marginTop: "0px" }} required>
                  {t("modifiers", keys)}
                </CustomFormLabel>
                <Autocomplete
                  className="capitalize"
                  renderGroup={(params) => (
                    <div key={params.key}>
                      <div
                        style={{
                          textTransform: "capitalize",
                          fontWeight: "bold",
                          padding: "4px 8px",
                        }}
                      >
                        {params.group}
                      </div>
                      {params.children}
                    </div>
                  )}
                  multiple={isMultiSelect}
                  disableCloseOnSelect
                  options={modifierOptions}
                  groupBy={(option) => option.group}
                  getOptionLabel={(option) => option.name}
                  value={isMultiSelect
                    ? modifierOptions.filter((option) => selectedModifiers?.includes(option.id))
                    : modifierOptions.find((option) => selectedModifiers?.includes(option.id)) || null
                  }
                  onChange={(event, newValue) => {
                    if (isMultiSelect) {
                      if (Array.isArray(newValue)) {
                        setSelectedModifiers?.(toggelSelectedItems(newValue.map((item) => item.id)));
                      }
                    } else {
                      if (newValue) {
                        setSelectedModifiers?.([(newValue as any).id]);
                      } else {
                        setSelectedModifiers?.([]);
                      }
                    }
                  }}
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      className="capitalize cursor-pointer hover:bg-slate-100 border-t flex items-center max-w-[500px]"
                    >
                      <Checkbox
                        checked={selectedModifiers?.includes(option.id)}
                        style={{ marginRight: 8 }}
                      />
                      <span className="break-words max-w-[200px]">
                        {option.name}
                      </span>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={`${!!selectedModifiers && selectedModifiers?.length > 0
                        ? ""
                        : t("choose_modifier", keys)
                        }`}
                    />
                  )}
                  disabled={selectedProducts?.length === 0}
                />

              </>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "center",
          pb: 4,
          gap: 2,
        }}
      >
        <Button
          sx={{ width: "172px", height: "56px", fontSize: "16px" }}
          onClick={() => {
            onClose();
            // handleDiscard();
          }}
          variant="outlined"
          color="primary"
        >
          {t("discard_changes", keys)}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            onSave();
            onClose();
          }}
          sx={{ width: "172px", height: "56px", fontSize: "16px" }}
        >
          {t("save", keys)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductSelectDialog;
