export type UserRole = "user" | "admin";

export type SubscriptionPlan = "free" | "pro" | "team";

export type SubscriptionStatus = "active" | "expired" | "cancelled";

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PlanLimits = {
  maxBoards: number;
  maxMembersPerBoard: number;
  cloudSync: boolean;
  exportEnabled: boolean;
  adsEnabled: boolean;
  retroPermanentRooms: boolean;
  advancedReports: boolean;
  maxTodoLists: number;
  maxTodosPerList: number;
  maxTimeTrackerDays: number;
  maxRetroCardsPerColumn: number;
  maxCustomCategories: number;
};

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxBoards: 1,
    maxMembersPerBoard: 2,
    cloudSync: false,
    exportEnabled: false,
    adsEnabled: true,
    retroPermanentRooms: false,
    advancedReports: false,
    maxTodoLists: 2,
    maxTodosPerList: 10,
    maxTimeTrackerDays: 7,
    maxRetroCardsPerColumn: 5,
    maxCustomCategories: 5,
  },
  pro: {
    maxBoards: 10,
    maxMembersPerBoard: 5,
    cloudSync: true,
    exportEnabled: true,
    adsEnabled: false,
    retroPermanentRooms: true,
    advancedReports: true,
    maxTodoLists: 20,
    maxTodosPerList: 100,
    maxTimeTrackerDays: 90,
    maxRetroCardsPerColumn: 30,
    maxCustomCategories: 50,
  },
  team: {
    maxBoards: -1, // ilimitado
    maxMembersPerBoard: -1,
    cloudSync: true,
    exportEnabled: true,
    adsEnabled: false,
    retroPermanentRooms: true,
    advancedReports: true,
    maxTodoLists: -1,
    maxTodosPerList: -1,
    maxTimeTrackerDays: -1,
    maxRetroCardsPerColumn: -1,
    maxCustomCategories: -1,
  },
};
