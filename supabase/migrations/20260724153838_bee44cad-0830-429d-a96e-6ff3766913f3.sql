UPDATE public.planner_x402_jobs
SET target_url = 'https://arcpilotai.lovable.app/api/public/paid/insight',
    next_run_at = now(),
    last_error = NULL
WHERE id = '30196096-2f48-40cf-a011-d254c5bfe95d';