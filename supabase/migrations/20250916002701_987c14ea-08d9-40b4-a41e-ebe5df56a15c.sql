-- Add new status values to the application_status enum
ALTER TYPE application_status ADD VALUE 'under_analysis_fi';
ALTER TYPE application_status ADD VALUE 'under_analysis_wm';