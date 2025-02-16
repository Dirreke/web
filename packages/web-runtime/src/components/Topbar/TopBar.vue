<template>
  <header
    id="oc-topbar"
    class="oc-flex oc-flex-middle oc-flex-between oc-px-m"
    :aria-label="$gettext('Top bar')"
  >
    <div class="oc-topbar-left oc-flex oc-flex-middle oc-flex-between">
      <applications-menu v-if="appMenuItems.length" :applications-list="appMenuItems" />
      <router-link ref="navigationSidebarLogo" to="/">
        <oc-img :src="logoImage" :alt="sidebarLogoAlt" class="oc-logo-image" />
      </router-link>
    </div>
    <div class="portal-wrapper">
      <portal-target name="app.runtime.header" multiple></portal-target>
    </div>
    <div class="oc-topbar-right oc-flex oc-flex-middle oc-flex-between">
      <portal-target name="app.runtime.header.right" multiple />
    </div>
    <portal to="app.runtime.header.right" :order="50">
      <theme-switcher v-if="darkThemeAvailable" />
      <feedback-link v-if="isFeedbackLinkEnabled" v-bind="feedbackLinkOptions" />
    </portal>
    <portal to="app.runtime.header.right" :order="100">
      <notifications v-if="isNotificationBellEnabled" />
      <user-menu v-if="isUserMenuEnabled" :applications-list="userMenuItems" />
    </portal>
  </header>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'
import NavigationMixin from '../../mixins/navigationMixin'

import ApplicationsMenu from './ApplicationsMenu.vue'
import UserMenu from './UserMenu.vue'
import Notifications from './Notifications.vue'
import FeedbackLink from './FeedbackLink.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import { useCapabilityNotifications, useStore, useUserContext } from 'web-pkg/src/composables'
import { computed, unref } from 'vue'

export default {
  components: {
    ApplicationsMenu,
    FeedbackLink,
    Notifications,
    ThemeSwitcher,
    UserMenu
  },
  mixins: [NavigationMixin],
  props: {
    applicationsList: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  setup() {
    const store = useStore()
    const notificationsSupport = useCapabilityNotifications()
    const isUserContext = useUserContext({ store })

    const isNotificationBellEnabled = computed(() => {
      return unref(isUserContext) && unref(notificationsSupport).includes('list')
    })

    return {
      isNotificationBellEnabled
    }
  },
  computed: {
    ...mapGetters(['configuration', 'user']),

    activeRoutePath() {
      return this.$router.resolve(this.$route).path
    },

    appMenuItems() {
      return this.navigation_getMenuItems([null, 'apps', 'appSwitcher'], this.activeRoutePath)
    },
    userMenuItems() {
      return this.navigation_getMenuItems(['user'], this.activeRoutePath)
    },

    darkThemeAvailable() {
      return this.configuration.themes.default && this.configuration.themes['default-dark']
    },

    sidebarLogoAlt() {
      return this.$gettext('Navigate to personal files page')
    },

    logoImage() {
      return this.configuration.currentTheme.logo.topbar
    },

    isFeedbackLinkEnabled() {
      return !this.configuration?.options?.disableFeedbackLink
    },

    feedbackLinkOptions() {
      const feedback = this.configuration?.options?.feedbackLink
      if (!this.isFeedbackLinkEnabled || !feedback) {
        return {}
      }

      return {
        ...(feedback.href && { href: feedback.href }),
        ...(feedback.ariaLabel && { ariaLabel: feedback.ariaLabel }),
        ...(feedback.description && { description: feedback.description })
      }
    },

    isUserMenuEnabled() {
      return this.user?.id
    }
  }
}
</script>

<style lang="scss">
#oc-topbar {
  height: 52px;
  position: sticky;
  z-index: 5;

  .portal-wrapper {
    @media (max-width: 639px) {
      margin-left: auto;
    }
  }

  img {
    max-height: 38px;
    image-rendering: auto;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
    image-rendering: -webkit-optimize-contrast;
    user-select: none;
  }

  .oc-topbar-left {
    gap: 30px;

    img.oc-logo-image {
      height: 38px;
    }
  }
  .oc-topbar-right {
    gap: 20px;
  }
  @media only screen and (max-width: 960px) {
    .oc-topbar-left,
    .oc-topbar-right {
      gap: 0.5rem;
    }
  }
}
</style>
