export type BaseProductType = {
  id: string;
  title: String;
  subTitle: String;
  recommended: Boolean;
  img: String;
  images?: string[];
  price: number;
  createdAt: Date;
};

export type InputProductType = {
  title: String;
  subTitle: String;
  recommended: Boolean;
  img: String;
  images?: string[];
  price: number;
};
