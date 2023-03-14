<template>
  <header
    id="oc-topbar"
    class="oc-flex oc-flex-middle oc-flex-between oc-pr-m oc-pl-s"
    :aria-label="$gettext('Top bar')"
  >
    <div class="oc-topbar-left oc-flex oc-flex-middle oc-flex-between">
      <applications-menu v-if="appMenuItems.length" :applications-list="appMenuItems" />
    </div>
    <div class="portal-wrapper">
      <portal-target name="app.runtime.header" multiple></portal-target>
    </div>
    <div class="oc-topbar-right oc-flex oc-flex-middle oc-flex-between">
      <portal-target name="app.runtime.header.right" multiple />
    </div>
    <portal to="app.runtime.header.right" :order="50">
        <oc-expanding-dropdown>
        <template #toggle>
          <oc-icon name="grid" size="large" class="oc-flex" />
        </template>
        <template #body>
          <oc-list class="applications-list">
            <div style="width: 200px; height: 150px">123</div>
          </oc-list>
        </template>
      </oc-expanding-dropdown>
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
import { useCapabilityNotifications, useStore, useUserContext } from 'web-pkg/src'
import { computed, unref } from 'vue'
import OcExpandingDropdown from '../../../../design-system/src/components/OcExpandingDropdown/OcExpandingDropdown.vue'

export default {
  components: {
    ApplicationsMenu,
    FeedbackLink,
    Notifications,
    ThemeSwitcher,
    UserMenu,
    OcExpandingDropdown
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
    width: 10rem;
    gap: 30px;
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
