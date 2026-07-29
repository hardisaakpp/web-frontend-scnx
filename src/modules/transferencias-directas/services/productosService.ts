import { transferenciasDirectasApi } from "@/lib/http";
import { BuscarProductosQuery, ProductoBusqueda } from "../types";

const productosService = {
    buscar: async(query: BuscarProductosQuery) : Promise<ProductoBusqueda[]> =>{
        const params: Record<string,string> = {}
        if(query.itemCode) params.itemCode = query.itemCode
        if(query.codeBars) params.codeBars = query.codeBars
        if(query.itemName) params.itemName = query.itemName

        const {data} = await transferenciasDirectasApi.get<ProductoBusqueda[]>('productos',{params})
        return data

    },
}
export default productosService