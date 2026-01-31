export type BaseProductType = {
  id: string;
  title: String;
  subTitle: String;
  recommended: Boolean;
  img: String;
  price: number;
  createdAt: Date;
};

export type InputProductType = {
  title: String;
  subTitle: String;
  recommended: Boolean;
  img: String;
  price: number;
};
