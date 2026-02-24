import fs from "fs";

const filePath = "./data/orders.json";

export const getOrders = () => {
  return JSON.parse(fs.readFileSync(filePath));
};

export const saveOrders = (orders) => {
  fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
};