import { ChangeEventHandler, MouseEventHandler, useState } from "react";
import { Holder } from "../../util/Holder";

export interface ServiceCheck{
    serviceId: string;
    checked: boolean;
}

export function Services({serviceChecks}: {serviceChecks: ServiceCheck[]}){
    const [services, setServices] = useState(new Holder(serviceChecks));
    const toggleAllCheck: MouseEventHandler<HTMLInputElement> = e=>{
        const elm = e.target as HTMLInputElement;
        services.value.forEach(s => s.checked = elm.checked);
        setServices(services.clone());
    };

    services.value.forEach(s=>console.log(`${s.serviceId}: ${s.checked}`));

    return <div>
        <label><input type="checkbox" onClick={toggleAllCheck} defaultChecked={true}></input>&nbsp; services:</label>
        {services.value.map((sc, i) => {
            const handleChange: ChangeEventHandler<HTMLInputElement> = e=>{
                sc.checked = e.target.checked;
                setServices(services.clone());
            };
            return <div key={i}>
                &nbsp;<label><input onChange={handleChange}
                    type="checkbox" checked={sc.checked} />&nbsp;
                <span>{sc.serviceId}</span></label>
                </div>;})}
        </div>;
};
