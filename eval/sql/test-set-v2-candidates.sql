-- Candidates for eval/test-set-v2.csv (recognition pipeline brief, Task 2a.1).
--
-- READ ONLY: one SELECT, nothing is written. Run it in the production
-- Supabase SQL editor and download the result as CSV.
--
-- It returns about 150 rows, one per photo (de-duplicated by image_url,
-- keeping the newest finished analysis), in these groups:
--
--   0_requested             the sooted-probe photo, always included
--   1_clear_vehicle         vehicle analyses at confidence 90 or more     (40)
--   2_hard_vehicle          vehicle analyses under 90 that named a make   (25)
--   3_no_vehicle_or_unknown vehicle analyses that ended Unknown, at
--                           confidence 0, or with vehicle_present false   (35)
--   4_part_with_number      part analyses that returned a part number     (20)
--   5_part_without_number   part analyses without one                     (30)
--
-- Within a group the rows rotate through different models (or part names)
-- before repeating one, newest first, so one popular truck can't fill a group.
-- No user_id or other personal column is selected.

with newest as (
    select distinct on (image_url)
        id, kind, image_url, status, confidence, created_at, result_data
    from analyses
    where (status = 'complete' and result_data is not null)
       or image_url like '%daab1dd3-02cb-4298-b0c8-8aa90887ce6e%'
    order by image_url, (status = 'complete') desc, created_at desc
),
fields as (
    select
        id, kind, image_url, status, confidence, created_at,
        nullif(btrim(result_data->'primary'->>'make'), '')  as make,
        nullif(btrim(result_data->'primary'->>'model'), '') as model,
        result_data->'primary'->>'year'                     as year,
        result_data->'primary'->>'trim'                     as trim_level,
        result_data->>'vehicle_present'                     as vehicle_present,
        nullif(btrim(result_data->>'partName'), '')         as part_name,
        nullif(btrim(result_data->>'partNumber'), '')       as part_number,
        result_data->>'estimatedVehicle'                    as estimated_vehicle,
        result_data->'sniperFallback'->>'reason'            as sniper_fallback
    from newest
),
grouped as (
    select *,
        case
            when image_url like '%daab1dd3-02cb-4298-b0c8-8aa90887ce6e%' then '0_requested'
            when kind = 'part' and part_number is not null then '4_part_with_number'
            when kind = 'part' then '5_part_without_number'
            when vehicle_present = 'false'
              or coalesce(confidence, 0) = 0
              or lower(coalesce(make, 'unknown')) in ('unknown', 'n/a', 'none', 'null')
                then '3_no_vehicle_or_unknown'
            when confidence >= 90 then '1_clear_vehicle'
            else '2_hard_vehicle'
        end as candidate_group
    from fields
),
rotated as (
    select *,
        row_number() over (
            partition by candidate_group,
                         lower(coalesce(make, '')), lower(coalesce(model, '')), lower(coalesce(part_name, ''))
            order by created_at desc
        ) as turn
    from grouped
),
ranked as (
    select *,
        row_number() over (partition by candidate_group order by turn, created_at desc) as pick
    from rotated
)
select
    image_url, candidate_group, id, kind, created_at, status, confidence,
    make, model, year, trim_level, vehicle_present,
    part_name, part_number, estimated_vehicle, sniper_fallback
from ranked
where pick <= case candidate_group
    when '0_requested'             then 1
    when '1_clear_vehicle'         then 40
    when '2_hard_vehicle'          then 25
    when '3_no_vehicle_or_unknown' then 35
    when '4_part_with_number'      then 20
    else 30
end
order by candidate_group, pick;
