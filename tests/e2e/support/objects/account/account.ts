import { Page } from 'playwright'
import util from 'util'

const accountMenuButton = '.oc-topbar-personal-avatar'
const quotaValue = '.storage-wrapper-text .oc-text-small'
const accountManageButton = '#oc-topbar-account-manage'
const infoValue = '.account-page-info-%s dd'

export class Account {
  #page: Page

  constructor({ page }: { page: Page }) {
    this.#page = page
  }

  async getQuotaValue(): Promise<string> {
    await this.#page.reload()
    await this.#page.locator(accountMenuButton).click()
    const quotaText = await this.#page.locator(quotaValue).textContent()
    await this.#page.locator(quotaValue).click()

    // parse "0 B of 10 GB used"
    const value = quotaText.split('of')
    return value[1].replace(/[^0-9]/g, '')
  }

  async getUserInfo(key: string): Promise<string> {
    await this.#page.locator(accountMenuButton).click()
    await this.#page.locator(accountManageButton).click()
    return await this.#page.locator(util.format(infoValue, key)).textContent()
  }
}
