UPDATE productos
SET categoria = CASE
  WHEN LOWER(nombre) LIKE '%desinfect%' THEN 'Desinfectantes'
  WHEN LOWER(nombre) LIKE '%deterg%' THEN 'Detergentes'
  WHEN LOWER(nombre) LIKE '%desengras%' THEN 'Desengrasantes'
  WHEN LOWER(nombre) LIKE '%multiusos%' OR LOWER(nombre) LIKE '%limpiador%' THEN 'Limpiadores multiusos'
  ELSE 'Otros productos de limpieza'
END
WHERE categoria IN ('Cerámica', 'Textil', 'Decoración', 'Joyería', 'Madera', 'Vidrio')
   OR categoria IS NULL
   OR TRIM(categoria) = '';