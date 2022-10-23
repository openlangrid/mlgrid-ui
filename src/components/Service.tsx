export interface ServiceCheck{
    serviceId: string;
    checked: boolean;
}

export function Service({sc}: {sc: ServiceCheck}){
    return <div>
        <label><input onChange={e=>sc.checked = e.target.checked}
            type="checkbox" defaultChecked={sc.checked} />&nbsp;
        <span>{sc.serviceId}</span></label>
    </div>;
}
