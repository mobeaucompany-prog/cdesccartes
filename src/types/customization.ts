// Types for customizable menu items like Bowls

export interface CustomizationOption {
  name: string;
  price_supplement: number;
  image?: string;
}

export interface OptionGroup {
  id: string;
  name: string;
  max_selections: number;
  required: boolean;
  options: CustomizationOption[];
}

export interface CustomizationConfig {
  option_groups: OptionGroup[];
}

export interface SelectedOption {
  group_id: string;
  option_name: string;
  price_supplement: number;
}

export interface CustomizedCartItem {
  id: string;
  nom: string;
  prix: number;
  quantity: number;
  image?: string;
  selectedSize?: string;
  customizations?: SelectedOption[];
}
