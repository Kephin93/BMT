export type BaseProductType = {
  id: string;
  title: string;
  subTitle: string;
  recommended: boolean;
  img: string[];
  price: number;
  createdAt: Date;
};

export type InputProductType = {
  title: string;
  subTitle: string;
  recommended: boolean;
  img: string[];
  price: number;
};
