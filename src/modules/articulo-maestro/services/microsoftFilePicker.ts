import {
    PublicClientApplication,
    type AccountInfo,
    type AuthenticationResult
} from '@azure/msal-browser'
import { getEnv } from '@/config/env'
import type { ImagenArticuloReferencia } from './articuloService'

const PICKER_TIMEOUT_MS = 10 * 60 * 1000
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

interface PickerItem {
    id?: string
    name?: string
    webUrl?: string
    parentReference?: {
        driveId?: string
    }
}

interface PickerCommand {
    type?: string
    id?: string
    data?: {
        command?:
            | string
            | {
                  type?: string
                  resource?: string
              }
        resource?: string
        items?: PickerItem[]
    }
}

let msalClient: PublicClientApplication | null = null

function getConfiguration() {
    const tenantId = getEnv('VITE_MS_TENANT_ID')
    const clientId = getEnv('VITE_MS_CLIENT_ID')
    const sharePointBaseUrl = getEnv(
        'VITE_SHAREPOINT_BASE_URL',
        'https://mabeltradingecuador.sharepoint.com/sites/fotosproductos'
    ).replace(/\/+$/, '')
    if (!tenantId || !clientId) {
        throw new Error(
            'El selector de SharePoint requiere VITE_MS_TENANT_ID y VITE_MS_CLIENT_ID.'
        )
    }
    return { tenantId, clientId, sharePointBaseUrl }
}

async function getMsalClient(): Promise<PublicClientApplication> {
    if (msalClient) return msalClient
    const { tenantId, clientId } = getConfiguration()
    msalClient = new PublicClientApplication({
        auth: {
            clientId,
            authority: `https://login.microsoftonline.com/${tenantId}`,
            redirectUri: globalThis.location.origin
        },
        cache: {
            cacheLocation: 'sessionStorage'
        }
    })
    await msalClient.initialize()
    return msalClient
}

async function getAccount(
    client: PublicClientApplication,
    resource: string
): Promise<AccountInfo> {
    const existing = client.getActiveAccount() ?? client.getAllAccounts()[0]
    if (existing) {
        client.setActiveAccount(existing)
        return existing
    }
    const login = await client.loginPopup({
        scopes: [`${new URL(resource).origin}/.default`],
        prompt: 'select_account'
    })
    client.setActiveAccount(login.account)
    return login.account
}

async function acquireToken(resource: string): Promise<string> {
    const client = await getMsalClient()
    const account = await getAccount(client, resource)
    const request = {
        account,
        scopes: [`${new URL(resource).origin}/.default`]
    }
    let result: AuthenticationResult
    try {
        result = await client.acquireTokenSilent(request)
    } catch {
        result = await client.acquireTokenPopup(request)
    }
    return result.accessToken
}

function parseSelectedItem(item: PickerItem): ImagenArticuloReferencia {
    const driveId = item.parentReference?.driveId
    if (!driveId || !item.id || !item.webUrl || !item.name) {
        throw new Error(
            'SharePoint no devolvió una referencia completa del archivo.'
        )
    }
    const extension = item.name.slice(item.name.lastIndexOf('.')).toLowerCase()
    if (!IMAGE_EXTENSIONS.includes(extension)) {
        throw new Error('Selecciona una imagen JPG, JPEG, PNG o WEBP.')
    }
    return {
        posicion: 1,
        esPrincipal: true,
        driveId,
        itemId: item.id,
        urlOriginal: item.webUrl,
        nombreOriginal: item.name
    }
}

export async function seleccionarImagenSharePoint(): Promise<ImagenArticuloReferencia> {
    const { sharePointBaseUrl } = getConfiguration()
    const token = await acquireToken(sharePointBaseUrl)
    const channelId = globalThis.crypto.randomUUID()
    const pickerOrigin = new URL(sharePointBaseUrl).origin
    const pickerWindow = globalThis.open(
        '',
        `SharePointPicker-${channelId}`,
        'width=1080,height=720,resizable=yes,scrollbars=yes'
    )
    if (!pickerWindow) {
        throw new Error(
            'El navegador bloqueó el selector. Habilita las ventanas emergentes para SCNexus.'
        )
    }

    const options = {
        sdk: '8.0',
        entry: {
            sharePoint: {
                byPath: { web: sharePointBaseUrl }
            }
        },
        authentication: {},
        messaging: {
            origin: globalThis.location.origin,
            channelId
        },
        typesAndSources: {
            mode: 'files',
            filters: IMAGE_EXTENSIONS
        },
        selection: { mode: 'single' }
    }
    const query = new URLSearchParams({
        filePicker: JSON.stringify(options),
        locale: 'es-ES'
    })
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = `${sharePointBaseUrl}/_layouts/15/FilePicker.aspx?${query}`
    form.target = pickerWindow.name
    const tokenInput = document.createElement('input')
    tokenInput.type = 'hidden'
    tokenInput.name = 'access_token'
    tokenInput.value = token
    form.appendChild(tokenInput)
    document.body.appendChild(form)

    return new Promise<ImagenArticuloReferencia>((resolve, reject) => {
        let port: MessagePort | null = null
        const timeout = globalThis.setTimeout(() => {
            cleanup()
            reject(new Error('El selector de SharePoint agotó el tiempo de espera.'))
        }, PICKER_TIMEOUT_MS)

        const cleanup = () => {
            globalThis.clearTimeout(timeout)
            globalThis.removeEventListener('message', onWindowMessage)
            port?.close()
            if (!pickerWindow.closed) pickerWindow.close()
        }

        const finish = (
            result?: ImagenArticuloReferencia,
            error?: Error
        ) => {
            cleanup()
            if (error) reject(error)
            else if (result) resolve(result)
        }

        const onPortMessage = async (event: MessageEvent<PickerCommand>) => {
            const message = event.data
            if (message.type !== 'command' || !message.id) return
            port?.postMessage({
                type: 'acknowledge',
                id: message.id
            })
            const rawCommand = message.data?.command
            const commandType =
                typeof rawCommand === 'string' ? rawCommand : rawCommand?.type
            const commandResource =
                message.data?.resource ??
                (typeof rawCommand === 'object'
                    ? rawCommand.resource
                    : undefined)
            try {
                if (commandType === 'authenticate') {
                    const pickerToken = await acquireToken(
                        commandResource || sharePointBaseUrl
                    )
                    port?.postMessage({
                        type: 'result',
                        id: message.id,
                        data: { result: 'token', token: pickerToken }
                    })
                    return
                }
                if (commandType === 'pick') {
                    const selected = message.data?.items?.[0]
                    if (!selected) throw new Error('No se seleccionó ningún archivo.')
                    const result = parseSelectedItem(selected)
                    port?.postMessage({
                        type: 'result',
                        id: message.id,
                        data: { result: 'success' }
                    })
                    finish(result)
                    return
                }
                if (commandType === 'close' || commandType === 'cancel') {
                    finish(undefined, new Error('Selección cancelada.'))
                }
            } catch (error: unknown) {
                const pickerError =
                    error instanceof Error
                        ? error
                        : new Error('No fue posible seleccionar la imagen.')
                port?.postMessage({
                    type: 'result',
                    id: message.id,
                    data: {
                        result: 'error',
                        error: { message: pickerError.message }
                    }
                })
                finish(undefined, pickerError)
            }
        }

        const onWindowMessage = (event: MessageEvent) => {
            if (
                event.source !== pickerWindow ||
                event.origin !== pickerOrigin ||
                event.data?.type !== 'initialize' ||
                event.data?.channelId !== channelId ||
                !event.ports[0]
            ) {
                return
            }
            port = event.ports[0]
            port.onmessage = onPortMessage
            port.start()
            port.postMessage({ type: 'activate' })
        }

        globalThis.addEventListener('message', onWindowMessage)
        form.submit()
        form.remove()
    })
}
