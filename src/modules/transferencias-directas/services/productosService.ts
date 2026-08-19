import { transferenciasDirectasApi } from "@/lib/http";
import { BuscarProductosQuery, ProductoBusqueda } from "../types";

const productosService = {
    /**
     * Busca productos. Acepta un AbortSignal para cancelar la petición cuando el
     * usuario sigue escribiendo: sin cancelar, respuestas lentas de una tecla vieja
     * pueden llegar después de una más reciente y pisar el resultado correcto.
     */
    buscar: async(query: BuscarProductosQuery, signal?: AbortSignal) : Promise<ProductoBusqueda[]> =>{
        const params: Record<string,string> = {}
        if(query.itemCode) params.itemCode = query.itemCode
        if(query.codeBars) params.codeBars = query.codeBars
        if(query.itemName) params.itemName = query.itemName
        if(query.whsCode) params.whsCode = query.whsCode

        const {data} = await transferenciasDirectasApi.get<ProductoBusqueda[]>('productos',{params, signal})
        return data

    },
}
export default productosService