BEGIN;

ALTER TABLE public.transaction_items
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
transaction_items_select_owned_shop
ON public.transaction_items;

CREATE POLICY transaction_items_select_owned_shop
ON public.transaction_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.transactions t
        JOIN public.shops s ON s.id = t.shop_id
        WHERE t.id = transaction_items.transaction_id
          AND s.owner_id = (SELECT auth.uid())
    )
);

COMMIT;