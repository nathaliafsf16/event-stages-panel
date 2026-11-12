export type EventRow = {
  id: string;
  name: string;
  created_at: string | Date;
  owner_user_id?: string | null;
  stage_count?: number | string;
  is_owner?: boolean;
};

export type StageRow = {
  id: string;
  event_id: string;
  name: string;
  stage_date: string | Date | null;
  notes: string | null;
  sort_order: number;
  created_at: string | Date;
};

export type EventWithStages = EventRow & {
  stages: StageRow[];
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
};
