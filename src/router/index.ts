import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import TeamScheduleView from '../views/TeamScheduleView.vue';
import LeagueView from '../views/LeagueView.vue';
import SettingsView from '../views/SettingsView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },       // <-- MUST exist
  { path: '/games', name: 'games', component: TeamScheduleView },
  { path: '/league', name: 'league', component: LeagueView },
  { path: '/settings', name: 'settings', component: SettingsView },
  { path: '/game/:gamePk', name: 'game-detail', component: () => import('@/views/GameDetailView.vue')},
  { path: '/:pathMatch(.*)*', redirect: '/' },
  {
    path: '/player/:playerId',
    name: 'player-detail',
    component: () => import('@/views/PlayerDetailView.vue')
  },
  /*{
    path: '/team/:teamId',
    name: 'team-detail',
    component: () => import('@/views/TeamDetailView.vue')
  }*/
  {
    path: '/team/:teamId/schedule',
    name: 'team-schedule',
    component: () => import('@/views/TeamScheduleView.vue')
  },
  {
    path: '/standings',
    name: 'standings',
    component: () => import('@/views/StandingsView.vue')
  }
];

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});
