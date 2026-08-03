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
    console.log('[FilePicker] getConfiguration() llamado');
    const tenantId = getEnv('VITE_MS_TENANT_ID')
    const clientId = getEnv('VITE_MS_CLIENT_ID')
    const sharePointBaseUrl = getEnv(
        'VITE_SHAREPOINT_BASE_URL',
        'https://mabeltradingecuador.sharepoint.com/sites/fotosproductos'
    ).replace(/\/+$/, '')
    
    if (!tenantId || !clientId) {
        console.error('[FilePicker] Error: Faltan variables de entorno MS_TENANT_ID o MS_CLIENT_ID');
        throw new Error(
            'El selector de SharePoint requiere VITE_MS_TENANT_ID y VITE_MS_CLIENT_ID.'
        )
    }
    
    console.log('[FilePicker] Configuración obtenida:', { tenantId, clientId, sharePointBaseUrl });

    return { tenantId, clientId, sharePointBaseUrl }
}

export async function getMsalClient(): Promise<PublicClientApplication> {
    console.log('[FilePicker] getMsalClient() llamado');
    if (msalClient) {
        console.log('[FilePicker] Usando msalClient existente');
        return msalClient
    }
    
    const { tenantId, clientId } = getConfiguration()
    console.log('[FilePicker] Inicializando nueva instancia de PublicClientApplication');
    msalClient = new PublicClientApplication({
        auth: {
            clientId,
            authority: `https://login.microsoftonline.com/${tenantId}`,
            redirectUri: globalThis.location.origin
        },
        cache: {
            cacheLocation: 'localStorage'
        }
    })
    
    try {
        await msalClient.initialize()
        console.log('[FilePicker] msalClient inicializado correctamente');
    } catch (e) {
        console.error('[FilePicker] Error inicializando msalClient:', e);
        throw e;
    }

    try {
        console.log('[FilePicker] Procesando posible respuesta de loginRedirect...');
        const redirectResult = await msalClient.handleRedirectPromise()
        if (redirectResult) {
            console.log('[FilePicker] Redirección de login completada para:', redirectResult.account.username);
            msalClient.setActiveAccount(redirectResult.account)
        }
    } catch (e) {
        console.error('[FilePicker] Error procesando handleRedirectPromise:', e);
    }

    return msalClient
}

async function getAccount(
    client: PublicClientApplication,
    resource: string
): Promise<AccountInfo> {
    console.log('[FilePicker] getAccount() buscando cuenta activa para recurso:', resource);
    const existing = client.getActiveAccount() ?? client.getAllAccounts()[0]
    if (existing) {
        console.log('[FilePicker] Cuenta existente encontrada en caché:', existing.username);
        client.setActiveAccount(existing)
        return existing
    }
    
    console.log('[FilePicker] No hay cuenta en caché. Redirigiendo a login de Microsoft...');
    await client.loginRedirect({
        scopes: [`${new URL(resource).origin}/.default`],
        prompt: 'select_account'
    })
    // loginRedirect navega la página completa hacia Microsoft; esta promesa no debe resolver,
    // el flujo continúa cuando la app se recarga y handleRedirectPromise() procesa la respuesta.
    return new Promise<AccountInfo>(() => {})
}

async function acquireToken(resource: string): Promise<string> {
    console.log('[FilePicker] acquireToken() solicitando token para:', resource);
    const client = await getMsalClient()
    const account = await getAccount(client, resource)
    const request = {
        account,
        scopes: [`${new URL(resource).origin}/.default`]
    }
    
    let result: AuthenticationResult
    try {
        console.log('[FilePicker] Intentando acquireTokenSilent...');
        result = await client.acquireTokenSilent(request)
        console.log('[FilePicker] acquireTokenSilent exitoso. Token adquirido.');
    } catch (silentError) {
        console.warn('[FilePicker] acquireTokenSilent falló. Abriendo popup para renovar...', silentError);
        try {
            result = await client.acquireTokenPopup(request)
        } catch (popupError) {
            console.error('[FilePicker] Error crítico en acquireTokenPopup:', popupError);
            throw popupError;
        }
    }
    return result.accessToken
}

function parseSelectedItem(item: PickerItem): ImagenArticuloReferencia {
    console.log('[FilePicker] Parseando item seleccionado:', item);
    const driveId = item.parentReference?.driveId
    if (!driveId || !item.id || !item.webUrl || !item.name) {
        console.error('[FilePicker] Referencia incompleta del item:', item);
        throw new Error(
            'SharePoint no devolvió una referencia completa del archivo.'
        )
    }
    const extension = item.name.slice(item.name.lastIndexOf('.')).toLowerCase()
    if (!IMAGE_EXTENSIONS.includes(extension)) {
        console.error(`[FilePicker] Extensión de archivo inválida: ${extension}`);
        throw new Error('Selecciona una imagen JPG, JPEG, PNG o WEBP.')
    }
    
    const parsed = {
        posicion: 1,
        esPrincipal: true,
        driveId,
        itemId: item.id,
        urlOriginal: item.webUrl,
        nombreOriginal: item.name
    };
    console.log('[FilePicker] Item parseado correctamente:', parsed);
    return parsed;
}

export async function seleccionarImagenSharePoint(): Promise<ImagenArticuloReferencia> {
    console.log('[FilePicker] --- INICIO seleccionarImagenSharePoint ---');
    const { sharePointBaseUrl } = getConfiguration()
    
    let token;
    try {
        token = await acquireToken(sharePointBaseUrl)
    } catch (e) {
        console.error('[FilePicker] Proceso abortado: No se pudo adquirir el token inicial.', e);
        throw e;
    }
    
    console.log('[FilePicker] Token listo. Generando ventana emergente del FilePicker...');
    const channelId = globalThis.crypto.randomUUID()
    const pickerOrigin = new URL(sharePointBaseUrl).origin
    
    console.log(`[FilePicker] Abriendo ventana hacia origen: ${pickerOrigin}, channelId: ${channelId}`);
    const pickerWindow = globalThis.open(
        '',
        `SharePointPicker-${channelId}`,
        'width=1080,height=720,resizable=yes,scrollbars=yes'
    )
    if (!pickerWindow) {
        console.error('[FilePicker] Navegador bloqueó la ventana emergente.');
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
    
    console.log('[FilePicker] Construyendo formulario POST...', options);
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
        console.log(`[FilePicker] Promise iniciada, esperando mensajes. Timeout configurado: ${PICKER_TIMEOUT_MS}ms`);
        
        const timeout = globalThis.setTimeout(() => {
            console.error('[FilePicker] TIMEOUT AGOTADO. No se completó la operación del FilePicker a tiempo.');
            cleanup()
            reject(new Error('El selector de SharePoint agotó el tiempo de espera.'))
        }, PICKER_TIMEOUT_MS)

        const cleanup = () => {
            console.log('[FilePicker] Ejecutando cleanup() de la ventana y listeners');
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
            if (error) {
                console.error('[FilePicker] Promesa terminada con error:', error);
                reject(error)
            } else if (result) {
                console.log('[FilePicker] Promesa terminada exitosamente.');
                resolve(result)
            }
        }

        const onPortMessage = async (event: MessageEvent<PickerCommand>) => {
            const message = event.data
            console.log('[FilePicker] Mensaje recibido del puerto (MessagePort):', message);
            
            if (message.type !== 'command' || !message.id) return
            port?.postMessage({
                type: 'acknowledge',
                id: message.id
            })
            
            const rawCommand = message.data?.command
            const commandType = typeof rawCommand === 'string' ? rawCommand : rawCommand?.type
            const commandResource = message.data?.resource ?? (typeof rawCommand === 'object' ? rawCommand.resource : undefined)
            
            console.log(`[FilePicker] Comando detectado: '${commandType}', resource: '${commandResource}'`);
            
            try {
                if (commandType === 'authenticate') {
                    console.log('[FilePicker] El picker solicita autenticación (acquireToken)...');
                    const pickerToken = await acquireToken(
                        commandResource || sharePointBaseUrl
                    )
                    console.log('[FilePicker] Token de picker adquirido. Enviando al puerto...');
                    port?.postMessage({
                        type: 'result',
                        id: message.id,
                        data: { result: 'token', token: pickerToken }
                    })
                    return
                }
                if (commandType === 'pick') {
                    console.log('[FilePicker] El picker envió la acción "pick"');
                    const selected = message.data?.items?.[0]
                    if (!selected) {
                        console.error('[FilePicker] No se seleccionó ningún archivo en la carga útil.');
                        throw new Error('No se seleccionó ningún archivo.')
                    }
                    const result = parseSelectedItem(selected)
                    console.log('[FilePicker] Enviando success al puerto y finalizando.');
                    port?.postMessage({
                        type: 'result',
                        id: message.id,
                        data: { result: 'success' }
                    })
                    finish(result)
                    return
                }
                if (commandType === 'close' || commandType === 'cancel') {
                    console.warn('[FilePicker] El usuario o sistema canceló el File Picker.');
                    finish(undefined, new Error('Selección cancelada.'))
                }
            } catch (error: unknown) {
                const pickerError = error instanceof Error ? error : new Error('No fue posible seleccionar la imagen.')
                console.error('[FilePicker] Error al procesar comando del puerto:', pickerError);
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
            if (event.source !== pickerWindow || event.origin !== pickerOrigin) {
                // Mensajes de otras fuentes o del propio MSAL que podemos ignorar aquí
                return
            }
            console.log('[FilePicker] Mensaje recibido de la ventana FilePicker (onWindowMessage):', event.data);
            
            if (event.data?.type !== 'initialize' || event.data?.channelId !== channelId || !event.ports[0]) {
                return
            }
            
            console.log('[FilePicker] Inicializando canal MessagePort con FilePicker...');
            port = event.ports[0]
            port.onmessage = onPortMessage
            port.start()
            port.postMessage({ type: 'activate' })
            console.log('[FilePicker] Canal activado (activate enviado).');
        }

        globalThis.addEventListener('message', onWindowMessage)
        console.log('[FilePicker] Listener de mensajes agregado. Enviando formulario (submit)...');
        form.submit()
        form.remove()
        console.log('[FilePicker] Formulario enviado y removido del DOM.');
    })
}
