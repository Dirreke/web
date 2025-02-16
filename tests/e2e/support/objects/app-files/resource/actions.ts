import { Download, Page } from 'playwright'
import { expect } from '@playwright/test'
import util from 'util'
import { resourceExists, waitForResources } from './utils'
import path from 'path'
import { File } from '../../../types'
import { sidebar } from '../utils'
import { config } from '../../../../config'

const downloadFileButtonSideBar =
  '#oc-files-actions-sidebar .oc-files-actions-download-file-trigger'
const downloadFolderButtonSidedBar =
  '#oc-files-actions-sidebar .oc-files-actions-download-archive-trigger'
const downloadButtonBatchAction = '.oc-files-actions-download-archive-trigger'
const deleteButtonBatchAction = '.oc-files-actions-delete-trigger'
const checkBox = `//*[@data-test-resource-name="%s"]//ancestor::tr//input`
const checkBoxForTrashbin = `//*[@data-test-resource-path="%s"]//ancestor::tr//input`
export const fileRow =
  '//ancestor::*[(contains(@class, "oc-tile-card") or contains(@class, "oc-tbody-tr"))]'
export const resourceNameSelector = `[data-test-resource-name="%s"]`
const addNewResourceButton = `#new-file-menu-btn`
const createNewFolderButton = '#new-folder-btn'
const createNewTxtFileButton = '.new-file-btn-txt'
const createNewMdFileButton = '.new-file-btn-md'
const createNewDrawioFileButton = '.new-file-btn-drawio'
const saveTextFileInEditorButton = '#text-editor-controls-save:visible'
const closeTextEditorOrViewerButton = '#app-top-bar-close'
const textEditorInput = '#text-editor-input'
const resourceNameInput = '.oc-modal input'
const resourceUploadButton = '#upload-menu-btn'
const fileUploadInput = '#files-file-upload-input'
const uploadInfoCloseButton = '#close-upload-info-btn'
const filesAction = `.oc-files-actions-%s-trigger`
const pasteButton = '.paste-files-btn'
const breadcrumbRoot = '//nav[contains(@class, "oc-breadcrumb")]/ol/li[1]'
const fileRenameInput = '.oc-text-input'
const deleteButtonSidebar = '#oc-files-actions-sidebar .oc-files-actions-delete-trigger'
const actionConfirmationButton =
  '//button[contains(@class,"oc-modal-body-actions-confirm") and text()="%s"]'
const actionSkipButton = '.oc-modal-body-actions-cancel'
const actionSecondaryConfirmationButton = '.oc-modal-body-actions-secondary'
const versionRevertButton = '//*[@data-testid="file-versions-revert-button"]'
const actionButton = '//*[contains(@data-testid, "action-handler")]/span[text()="%s"]'
const emptyTrashBinButton = '.oc-files-actions-empty-trash-bin-trigger'
const notificationMessageDialog = '.oc-notification-message-title'
const permanentDeleteButton = '.oc-files-actions-delete-permanent-trigger'
const restoreResourceButton = '.oc-files-actions-restore-trigger'
const globalSearchInput = '.oc-search-input'
const searchList =
  '//div[@id="files-global-search-options"]//li[contains(@class,"preview")]//span[@class="oc-resource-name"]'
const globalSearchOptions = '#files-global-search-options'
const loadingSpinner = '#files-global-search-options .loading'
const filesViewOptionButton = '#files-view-options-btn'
const hiddenFilesToggleButton = '//*[@data-testid="files-switch-hidden-files"]//button'
const previewImage = '//main[@id="preview"]//div[contains(@class,"preview-player")]//img'
const drawioSaveButton = '.geBigButton >> text=Save'
const drawioIframe = '#drawio-editor'
const tagTableCell =
  '//*[@data-test-resource-name="%s"]/ancestor::tr//td[contains(@class, "oc-table-data-cell-tags")]'
const tagInFilesTable = '//*[contains(@class, "oc-tag")]//span[text()="%s"]//ancestor::a'
const tagInDetailsPanel = '//*[@data-testid="tags"]/td//span[text()="%s"]'
const tagInInputForm =
  '//span[contains(@class, "vs__selected")]//span[text()="%s"]//ancestor::span/button[contains(@class, "vs__deselect")]'
const tagFormInput = '#tags-form input'
const compareDialogConfirmBtn = '.compare-save-dialog-confirm-btn'
const resourcesAsTiles = '#files-view .oc-tiles'

export const clickResource = async ({
  page,
  path
}: {
  page: Page
  path: string
}): Promise<void> => {
  const paths = path.split('/')
  for (const name of paths) {
    const resource = await page.locator(util.format(resourceNameSelector, name))
    const itemId = await resource.locator(fileRow).getAttribute('data-item-id')
    await Promise.all([
      resource.click(),
      page.waitForResponse(
        (resp) => resp.url().endsWith(encodeURIComponent(name)) || resp.url().endsWith(itemId)
      )
    ])

    // TODO: Refactor so the line below becomes unnecessary
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

/**/

export interface createResourceArgs {
  page: Page
  name: string
  type: 'folder' | 'txtFile' | 'mdFile' | 'drawioFile'
  content?: string
}

export const createNewFolder = async ({
  page,
  resource
}: {
  page: Page
  resource: string
}): Promise<void> => {
  await page.locator(createNewFolderButton).click()
  await page.locator(resourceNameInput).fill(resource)
  await Promise.all([
    page.waitForResponse((resp) => resp.status() === 207 && resp.request().method() === 'PROPFIND'),
    page.locator(util.format(actionConfirmationButton, 'Create')).click()
  ])
}

export const createNewFileOrFolder = async (args: createResourceArgs): Promise<void> => {
  const { page, name, type, content } = args
  await page.locator(addNewResourceButton).click()
  switch (type) {
    case 'folder': {
      await createNewFolder({ page, resource: name })
      break
    }
    case 'txtFile': {
      await page.locator(createNewTxtFileButton).click()
      await page.locator(resourceNameInput).fill(name)
      await Promise.all([
        page.waitForResponse((resp) => resp.status() === 201 && resp.request().method() === 'PUT'),
        page.locator(util.format(actionConfirmationButton, 'Create')).click()
      ])
      await editTextDocument({ page, content, name })
      break
    }
    case 'mdFile': {
      await page.locator(createNewMdFileButton).click()
      await page.locator(resourceNameInput).fill(name)
      await Promise.all([
        page.waitForResponse((resp) => resp.status() === 201 && resp.request().method() === 'PUT'),
        page.locator(util.format(actionConfirmationButton, 'Create')).click()
      ])
      await editTextDocument({ page, content, name })
      break
    }
    case 'drawioFile': {
      await page.locator(createNewDrawioFileButton).click()
      await page.locator(resourceNameInput).fill(name)

      await page.locator(util.format(actionConfirmationButton, 'Create')).click()
      await page.waitForResponse(
        (resp) => resp.status() === 201 && resp.request().method() === 'PUT'
      )
      await page.waitForLoadState()
      await page.frameLocator(drawioIframe).locator(drawioSaveButton).click()
      await page.waitForURL('**/draw-io/personal/**')

      // TODO: Update to use appTopBar once #8447 is merged
      await page.goto(page.url())
      break
    }
  }
}

export const createResources = async (args: createResourceArgs): Promise<void> => {
  const { page, name, type, content } = args
  const paths = name.split('/')
  const resource = paths.pop()

  for (const path of paths) {
    const resourcesExists = await resourceExists({
      page: page,
      name: path
    })

    if (!resourcesExists) {
      await page.locator(addNewResourceButton).click()
      await createNewFolder({ page, resource: path })
    }
    await clickResource({ page, path })
  }
  await createNewFileOrFolder({ page, name: resource, type, content })
}

export const editTextDocument = async ({
  page,
  name,
  content
}: {
  page: Page
  name: string
  content: string
}): Promise<void> => {
  await page.locator(textEditorInput).fill(content)
  await Promise.all([
    page.waitForResponse((resp) => resp.status() === 204 && resp.request().method() === 'PUT'),
    page.waitForResponse((resp) => resp.status() === 207 && resp.request().method() === 'PROPFIND'),
    page.locator(saveTextFileInEditorButton).click()
  ])
  await Promise.all([page.waitForNavigation(), page.locator(closeTextEditorOrViewerButton).click()])
  await page.waitForSelector(util.format(resourceNameSelector, name))
  await page.waitForSelector(fileRow)
}

/**/

export interface uploadResourceArgs {
  page: Page
  resources: File[]
  to?: string
  option?: string
}

export const uploadResource = async (args: uploadResourceArgs): Promise<void> => {
  const { page, resources, to, option } = args
  if (to) {
    await clickResource({ page, path: to })
  }

  await page.locator(resourceUploadButton).click()
  await page.locator(fileUploadInput).setInputFiles(resources.map((file) => file.path))

  if (option) {
    switch (option) {
      case 'skip': {
        await page.locator(actionSkipButton).click()
        break
      }
      case 'merge':
      case 'replace': {
        await page.locator(actionSecondaryConfirmationButton).click()
        await page.locator(uploadInfoCloseButton).click()

        await waitForResources({
          page: page,
          names: resources.map((file) => path.basename(file.name))
        })
        break
      }
      case 'keep both': {
        await page.locator(util.format(actionConfirmationButton, 'Keep both')).click()
        await page.locator(uploadInfoCloseButton).click()

        await waitForResources({
          page: page,
          names: resources.map((file) => path.basename(file.name))
        })
        break
      }
    }
  } else {
    await page.locator(uploadInfoCloseButton).click()

    await waitForResources({
      page: page,
      names: resources.map((file) => path.basename(file.name))
    })
  }
}

/**/

interface resourceArgs {
  name: string
  type: string
}

export interface downloadResourcesArgs {
  page: Page
  resources: resourceArgs[]
  folder?: string
  via: 'SIDEBAR_PANEL' | 'BATCH_ACTION'
}

export const downloadResources = async (args: downloadResourcesArgs): Promise<Download[]> => {
  const { page, resources, folder, via } = args
  const downloads = []

  switch (via) {
    case 'SIDEBAR_PANEL': {
      if (folder) {
        await clickResource({ page, path: folder })
      }
      for (const resource of resources) {
        await sidebar.open({ page, resource: resource.name })
        await sidebar.openPanel({ page, name: 'actions' })
        const downloadResourceSelector =
          resource.type === 'file' ? downloadFileButtonSideBar : downloadFolderButtonSidedBar
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          page.locator(downloadResourceSelector).click()
        ])

        await sidebar.close({ page })

        downloads.push(download)
      }
      break
    }

    case 'BATCH_ACTION': {
      await selectOrDeselectResources({ page, resources, folder, select: true })
      if (resources.length === 1) {
        throw new Error('Single resource cannot be downloaded with batch action')
      }
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator(downloadButtonBatchAction).click()
      ])
      downloads.push(download)
      break
    }
  }

  return downloads
}

export type selectResourcesArgs = {
  page: Page
  resources: resourceArgs[]
  folder?: string
  select: boolean
}

export const selectOrDeselectResources = async (args: selectResourcesArgs): Promise<void> => {
  const { page, folder, resources, select } = args
  if (folder) {
    await clickResource({ page, path: folder })
  }

  for (const resource of resources) {
    const exists = await resourceExists({
      page,
      name: resource.name
    })
    if (exists) {
      const resourceCheckbox = page.locator(util.format(checkBox, resource.name))

      if (!(await resourceCheckbox.isChecked()) && select) {
        await resourceCheckbox.check()
      } else if (await resourceCheckbox.isChecked()) {
        await resourceCheckbox.uncheck()
      }
    } else {
      throw new Error(`The resource ${resource.name} you are trying to select does not exist`)
    }
  }
}

/**/

export interface moveOrCopyResourceArgs {
  page: Page
  resource: string
  newLocation: string
  action: 'copy' | 'move'
  method: string
}
export const pasteResource = async (
  args: Omit<moveOrCopyResourceArgs, 'action' | 'method'>
): Promise<void> => {
  const { page, resource, newLocation } = args

  await page.locator(breadcrumbRoot).click()
  const newLocationPath = newLocation.split('/')

  for (const path of newLocationPath) {
    if (path !== 'Personal') {
      await clickResource({ page, path: path })
    }
  }

  await page.locator(pasteButton).click()
  await waitForResources({
    page,
    names: [resource]
  })
}

export const moveOrCopyResource = async (args: moveOrCopyResourceArgs): Promise<void> => {
  const { page, resource, newLocation, action, method } = args
  const { dir: resourceDir, base: resourceBase } = path.parse(resource)

  if (resourceDir) {
    await clickResource({ page, path: resourceDir })
  }

  switch (method) {
    case 'dropdown-menu': {
      await page.locator(util.format(resourceNameSelector, resourceBase)).click({ button: 'right' })
      await page.locator(util.format(filesAction, action)).first().click()
      await pasteResource({ page, resource: resourceBase, newLocation })
      break
    }
    case 'sidebar-panel': {
      await sidebar.open({ page: page, resource: resourceBase })
      await sidebar.openPanel({ page: page, name: 'actions' })

      const actionButtonType = action === 'copy' ? 'Copy' : 'Cut'
      await page.locator(util.format(actionButton, actionButtonType)).click()
      await pasteResource({ page, resource: resourceBase, newLocation })
      break
    }
    case 'keyboard': {
      const resourceCheckbox = page.locator(util.format(checkBox, resourceBase))
      await resourceCheckbox.check()
      const keyValue = action === 'copy' ? 'C' : 'X'
      await page.keyboard.press(`Control+${keyValue}`)
      await page.locator(breadcrumbRoot).click()
      const newLocationPath = newLocation.split('/')
      for (const path of newLocationPath) {
        if (path !== 'Personal') {
          await clickResource({ page, path: path })
        }
      }
      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().endsWith(resource) &&
            resp.status() === 201 &&
            resp.request().method() === (action === 'copy' ? 'COPY' : 'MOVE')
        ),
        page.locator(util.format(resourceNameSelector, resource)),
        await page.keyboard.press('Control+V')
      ])
      break
    }
    case 'drag-drop': {
      const source = page.locator(util.format(resourceNameSelector, resourceBase))
      const target = page.locator(util.format(resourceNameSelector, newLocation))

      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().endsWith(resource) &&
            resp.status() === 201 &&
            resp.request().method() === 'MOVE'
        ),
        source.dragTo(target)
      ])

      await Promise.all([
        page.locator(util.format(resourceNameSelector, resourceBase)),
        page.locator(util.format(resourceNameSelector, newLocation)).click()
      ])

      break
    }
  }
}

/**/

export interface renameResourceArgs {
  page: Page
  resource: string
  newName: string
}

export interface resourceTagsArgs {
  page: Page
  resource: string
  tags: string[]
}

export const renameResource = async (args: renameResourceArgs): Promise<void> => {
  const { page, resource, newName } = args
  const { dir: resourceDir, base: resourceBase } = path.parse(resource)

  if (resourceDir) {
    await clickResource({ page, path: resourceDir })
  }

  await page.locator(util.format(resourceNameSelector, resourceBase)).click({ button: 'right' })
  await page.locator(util.format(filesAction, 'rename')).click()
  await page.locator(fileRenameInput).fill(newName)
  await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().endsWith(resourceBase) &&
        resp.status() === 201 &&
        resp.request().method() === 'MOVE'
    ),
    page.locator(util.format(resourceNameSelector, newName)),
    page.locator(util.format(actionConfirmationButton, 'Rename')).click()
  ])
}

/**/

export interface restoreResourceVersionArgs {
  page: Page
  files: File[]
  folder?: string
}

export const restoreResourceVersion = async (args: restoreResourceVersionArgs) => {
  const { page, files, folder } = args
  const fileName = files.map((file) => path.basename(file.name))
  await clickResource({ page, path: folder })
  await sidebar.open({ page, resource: fileName[0] })
  await sidebar.openPanel({ page, name: 'versions' })

  await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes('/v/') && resp.status() === 204 && resp.request().method() === 'COPY'
    ),
    await page.locator(versionRevertButton).click()
  ])
}

/**/
export interface deleteResourceArgs {
  page: Page
  resourcesWithInfo: resourceArgs[]
  folder?: string
  via: 'SIDEBAR_PANEL' | 'BATCH_ACTION'
}

export const deleteResource = async (args: deleteResourceArgs): Promise<void> => {
  const { page, resourcesWithInfo, folder, via } = args
  switch (via) {
    case 'SIDEBAR_PANEL': {
      if (folder) {
        await clickResource({ page, path: folder })
      }
      for (const resource of resourcesWithInfo) {
        await sidebar.open({ page, resource: resource.name })
        await sidebar.openPanel({ page, name: 'actions' })
        await page.locator(deleteButtonSidebar).first().click()
        await Promise.all([
          page.waitForResponse(
            (resp) =>
              resp.url().includes(encodeURIComponent(resource.name)) &&
              resp.status() === 204 &&
              resp.request().method() === 'DELETE'
          ),
          page.locator(util.format(actionConfirmationButton, 'Delete')).click()
        ])
        await sidebar.close({ page })
      }
      break
    }

    case 'BATCH_ACTION': {
      await selectOrDeselectResources({ page, resources: resourcesWithInfo, folder, select: true })
      const deletetedResources = []
      if (resourcesWithInfo.length <= 1) {
        throw new Error('Single resource or objects cannot be deleted with batch action')
      }

      await page.locator(deleteButtonBatchAction).click()
      await Promise.all([
        page.waitForResponse((resp) => {
          if (resp.status() === 204 && resp.request().method() === 'DELETE') {
            deletetedResources.push(decodeURIComponent(resp.url().split('/').pop()))
          }
          // waiting for GET response after all the resource are deleted with batch action
          return (
            resp.url().includes(config.ocis ? 'graph/v1.0/drives' : 'ocs/v1.php/cloud/users') &&
            resp.status() === 200 &&
            resp.request().method() === 'GET'
          )
        }),
        page.locator(util.format(actionConfirmationButton, 'Delete')).click()
      ])
      // assertion that the resources actually got deleted
      expect(resourcesWithInfo.length).toBe(deletetedResources.length)
      for (const resource of resourcesWithInfo) {
        expect(deletetedResources).toContain(resource.name)
      }
      break
    }
  }
}

export interface downloadResourceVersionArgs {
  page: Page
  files: File[]
  folder?: string
}

export const downloadResourceVersion = async (
  args: downloadResourceVersionArgs
): Promise<Download[]> => {
  const { page, files, folder } = args
  const fileName = files.map((file) => path.basename(file.name))
  const downloads = []
  await clickResource({ page, path: folder })
  await sidebar.open({ page, resource: fileName[0] })
  await sidebar.openPanel({ page, name: 'versions' })
  const [download] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes('/v/') && resp.status() === 200 && resp.request().method() === 'HEAD'
    ),
    page.waitForEvent('download'),
    await page.locator('//*[@data-testid="file-versions-download-button"]').first().click()
  ])
  await sidebar.close({ page: page })
  downloads.push(download)
  return downloads
}

export const emptyTrashBinResources = async (page): Promise<string> => {
  await page.locator(emptyTrashBinButton).click()
  const statuses = [204, 403]
  await Promise.all([
    page.waitForResponse(
      (resp) => statuses.includes(resp.status()) && resp.request().method() === 'DELETE'
    ),
    page.locator(util.format(actionConfirmationButton, 'Delete')).click()
  ])
  const message = await page.locator(notificationMessageDialog).textContent()
  return message.trim().toLowerCase()
}

export interface deleteResourceTrashbinArgs {
  page: Page
  resource: string
}

export const deleteResourceTrashbin = async (args: deleteResourceTrashbinArgs): Promise<string> => {
  const { page, resource } = args
  const resourceCheckbox = page.locator(
    util.format(checkBoxForTrashbin, `/${resource.replace(/^\/+/, '')}`)
  )
  await new Promise((resolve) => setTimeout(resolve, 5000))
  if (!(await resourceCheckbox.isChecked())) {
    await resourceCheckbox.check()
  }
  const statuses = [204, 403]
  await page.locator(permanentDeleteButton).first().click()
  await Promise.all([
    page.waitForResponse(
      (resp) => statuses.includes(resp.status()) && resp.request().method() === 'DELETE'
    ),
    page.locator(util.format(actionConfirmationButton, 'Delete')).click()
  ])
  const message = await page.locator(notificationMessageDialog).textContent()
  return message.trim().toLowerCase()
}

export const getDeleteResourceButtonVisibility = async (
  args: deleteResourceTrashbinArgs
): Promise<boolean> => {
  const { page, resource } = args
  const resourceCheckbox = page.locator(
    util.format(checkBoxForTrashbin, `/${resource.replace(/^\/+/, '')}`)
  )
  if (!(await resourceCheckbox.isChecked())) {
    await resourceCheckbox.check()
  }
  return await page.locator(permanentDeleteButton).isVisible()
}

export interface restoreResourceTrashbinArgs {
  resource: string
  page: Page
}

export interface clickTagArgs {
  resource: string
  tag: string
  page: Page
}

export const restoreResourceTrashbin = async (
  args: restoreResourceTrashbinArgs
): Promise<string> => {
  const { page, resource } = args
  const resourceCheckbox = page.locator(
    util.format(checkBoxForTrashbin, `/${resource.replace(/^\/+/, '')}`)
  )
  if (!(await resourceCheckbox.isChecked())) {
    await resourceCheckbox.check()
  }
  const statuses = [201, 403]
  await Promise.all([
    page.waitForResponse(
      (resp) => statuses.includes(resp.status()) && resp.request().method() === 'MOVE'
    ),
    await page.locator(restoreResourceButton).click()
  ])

  const message = await page.locator(notificationMessageDialog).textContent()
  return message.trim().toLowerCase()
}

export const getRestoreResourceButtonVisibility = async (
  args: restoreResourceTrashbinArgs
): Promise<boolean> => {
  const { page, resource } = args
  const resourceCheckbox = page.locator(
    util.format(checkBoxForTrashbin, `/${resource.replace(/^\/+/, '')}`)
  )
  if (!(await resourceCheckbox.isChecked())) {
    await resourceCheckbox.check()
  }
  return await page.locator(restoreResourceButton).isVisible()
}

export const getTagsForResourceVisibilityInFilesTable = async (
  args: resourceTagsArgs
): Promise<boolean> => {
  const { page, resource, tags } = args
  const { dir: resourceDir } = path.parse(resource)

  const folderPaths = resource.split('/')
  const resourceName = folderPaths.pop()

  if (resourceDir) {
    await clickResource({ page, path: resourceDir })
  }

  const tagCellSelector = util.format(tagTableCell, resourceName)
  await page.waitForSelector(tagCellSelector)
  const resourceTagCell = page.locator(tagCellSelector)

  for (const tag of tags) {
    const tagSpan = resourceTagCell.locator(util.format(tagInFilesTable, tag))
    const isVisible = await tagSpan.isVisible()
    if (!isVisible) {
      return false
    }
  }

  return true
}

export const clickResourceTag = async (args: clickTagArgs): Promise<void> => {
  const { page, resource, tag } = args
  const { dir: resourceDir } = path.parse(resource)

  const folderPaths = resource.split('/')
  const resourceName = folderPaths.pop()

  if (resourceDir) {
    await clickResource({ page, path: resourceDir })
  }

  const tagCellSelector = util.format(tagTableCell, resourceName)
  await page.waitForSelector(tagCellSelector)
  const resourceTagCell = page.locator(tagCellSelector)
  const tagSpan = resourceTagCell.locator(util.format(tagInFilesTable, tag))
  return tagSpan.click()
}

export const getTagsForResourceVisibilityInDetailsPanel = async (
  args: resourceTagsArgs
): Promise<boolean> => {
  const { page, resource, tags } = args
  const { dir: resourceDir } = path.parse(resource)

  const folderPaths = resource.split('/')
  const resourceName = folderPaths.pop()

  if (resourceDir) {
    await clickResource({ page, path: resourceDir })
  }

  await sidebar.open({ page: page, resource: resourceName })

  for (const tag of tags) {
    const tagSelector = util.format(tagInDetailsPanel, tag)
    await page.waitForSelector(tagSelector)
    const tagSpan = page.locator(tagSelector)
    const isVisible = await tagSpan.isVisible()
    if (!isVisible) {
      return false
    }
  }

  return true
}

export interface searchResourceGlobalSearchArgs {
  keyword: string
  page: Page
}

export const searchResourceGlobalSearch = async (
  args: searchResourceGlobalSearchArgs
): Promise<void> => {
  const { page, keyword } = args

  // .reload() waits nicely for search indexing to be finished
  await page.reload()

  await Promise.all([
    page.waitForResponse((resp) => resp.status() === 207 && resp.request().method() === 'REPORT'),
    page.locator(globalSearchInput).fill(keyword)
  ])
  await expect(page.locator(globalSearchOptions)).toBeVisible()
  await expect(page.locator(loadingSpinner)).not.toBeVisible()
}

export type displayedResourceType = 'search list' | 'files list'

export interface getDisplayedResourcesArgs {
  keyword: displayedResourceType
  page: Page
}

export const getDisplayedResourcesFromSearch = async (page): Promise<string[]> => {
  const result = await page.locator(searchList).allInnerTexts()
  // the result has values like `test\n.txt` so remove new line
  return result.map((result) => result.replace('\n', ''))
}

export const getDisplayedResourcesFromFilesList = async (page): Promise<string[]> => {
  const files = []
  const result = page.locator(resourceNameSelector)

  const count = await result.count()
  for (let i = 0; i < count; i++) {
    files.push(await result.nth(i).getAttribute('data-test-resource-name'))
  }

  return files
}

export interface switchViewModeArgs {
  page: Page
  target: 'resource-table' | 'resource-tiles'
}

export const clickViewModeToggle = async (args: switchViewModeArgs): Promise<void> => {
  const { page, target } = args
  await page.locator(`.viewmode-switch-buttons .${target}`).click()
}

export const getTilesVisibility = async (args): Promise<boolean> => {
  const { page } = args
  return await page.locator(resourcesAsTiles).isVisible()
}

export const showHiddenResources = async (page): Promise<void> => {
  await page.locator(filesViewOptionButton).click()
  await page.locator(hiddenFilesToggleButton).click()
}

export interface editResourcesArgs {
  page: Page
  name: string
  content: string
}

export const editResources = async (args: editResourcesArgs): Promise<void> => {
  const { page, name, content } = args
  const { dir: resourceDir } = path.parse(name)

  const folderPaths = name.split('/')
  const resourceName = folderPaths.pop()

  if (resourceDir) {
    await clickResource({ page, path: resourceDir })
  }

  await page.locator(util.format(resourceNameSelector, resourceName)).click()
  await editTextDocument({ page, content: content, name: resourceName })
}

export const addTagsToResource = async (args: resourceTagsArgs): Promise<void> => {
  const { page, resource, tags } = args
  const { dir: resourceDir } = path.parse(resource)

  const folderPaths = resource.split('/')
  const resourceName = folderPaths.pop()

  if (resourceDir) {
    await clickResource({ page, path: resourceDir })
  }

  await sidebar.open({ page: page, resource: resourceName })
  await sidebar.openPanel({ page: page, name: 'tags' })

  const inputForm = page.locator(tagFormInput)

  for (const tag of tags) {
    await inputForm.fill(tag)
    await page.locator('.vs__dropdown-option').first().click()
  }

  await page.locator(compareDialogConfirmBtn).click()
  await sidebar.close({ page })
}

export const removeTagsFromResource = async (args: resourceTagsArgs): Promise<void> => {
  const { page, resource, tags } = args
  const { dir: resourceDir } = path.parse(resource)

  const folderPaths = resource.split('/')
  const resourceName = folderPaths.pop()

  if (resourceDir) {
    await clickResource({ page, path: resourceDir })
  }

  await sidebar.open({ page: page, resource: resourceName })
  await sidebar.openPanel({ page: page, name: 'tags' })

  for (const tag of tags) {
    await page.locator(util.format(tagInInputForm, tag)).click()
  }

  await page.locator(compareDialogConfirmBtn).click()
  await sidebar.close({ page })
}

export interface openFileInViewerArgs {
  page: Page
  name: string
  actionType: 'mediaviewer' | 'pdfviewer'
}

export const openFileInViewer = async (args: openFileInViewerArgs): Promise<void> => {
  const { page, name, actionType } = args

  if (actionType === 'mediaviewer') {
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('preview') &&
          resp.status() === 200 &&
          resp.request().method() === 'GET'
      ),
      page.locator(util.format(resourceNameSelector, name)).click()
    ])

    // in case of error <img> doesn't contain src="blob:https://url"
    expect(await page.locator(previewImage).getAttribute('src')).toContain('blob')
  } else {
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.status() === 207 && resp.request().method() === 'PROPFIND'
      ),
      page.locator(util.format(resourceNameSelector, name)).click()
    ])
  }

  await Promise.all([page.waitForNavigation(), page.locator(closeTextEditorOrViewerButton).click()])
}
