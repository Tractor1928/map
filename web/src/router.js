import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Edit',
    component: () => import(`./pages/Edit/Index.vue`),
    meta: { keepAlive: true }
  },
  {
    path: '/index',
    redirect: '/'
  },
  {
    path: '/mobile',
    name: 'Mobile',
    component: () => import(`./pages/Mobile/Index.vue`),
    meta: { keepAlive: true }
  },
  {
    path: '/doc/zh',
    component: () => import(`./pages/Doc.vue`)
  }
]

const router = new VueRouter({
  routes
})

export default router
