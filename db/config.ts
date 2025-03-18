import { column, defineDb, defineTable, desc } from 'astro:db';

const Product = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    price: column.number(),
    description: column.text(),
    rating: column.number(),
    reviews: column.number(),
    image: column.text(),
  },
});

// https://astro.build/db/config
export default defineDb({
  tables: {
    Product,
  },
});
