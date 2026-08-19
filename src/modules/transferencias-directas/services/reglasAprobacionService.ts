import { MatrizAprobacion, ReglaAprobacionRequest } from "../types";
import { transferenciasDirectasApi } from "@/lib/http";

const reglasAprobacionService = {
    listar: async (): Promise<MatrizAprobacion[]> => {
        const {data} = await transferenciasDirectasApi.get<MatrizAprobacion[]>('reglas-aprobacion');
        return data;
    },
    
    crear: async(body: ReglaAprobacionRequest): Promise<MatrizAprobacion> => {
        const {data} = await transferenciasDirectasApi.post<MatrizAprobacion>('reglas-aprobacion', body);
        return data;
    },
    actualizar: async(id:number,body:ReglaAprobacionRequest): Promise<MatrizAprobacion> => {
        const {data} = await transferenciasDirectasApi.put<MatrizAprobacion>(`reglas-aprobacion/${id}`, body);
        return data;
    },
    eliminar: async(id:number): Promise<void> => {
        await transferenciasDirectasApi.delete<void>(`reglas-aprobacion/${id}`);
    },
}
export default reglasAprobacionService;