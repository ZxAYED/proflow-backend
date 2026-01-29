export type ICreateSubItemPayload = {
  title: string;
  isDone?: boolean;
  order?: number;
};

export type IUpdateSubItemPayload = Partial<ICreateSubItemPayload>;
