
  add real data , update database 
  update admin dashbooard use graphas and more 
  add search bar



6️⃣ Final Database Structure

After changes your tables should be:

vendors

| id | name | email | password |

products

| id | name | description | category |

vendor_products

| id | vendor_id | product_id | price | stock |

orders

| id | user_name | vendor_id | total |

order_items

| id | order_id | vendor_product_id | quantity | price |

ratings

| id | vendor_id | rating | review |