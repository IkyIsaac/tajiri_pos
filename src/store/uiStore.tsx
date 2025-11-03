import {create} from 'zustand';
export interface nameStore{
    name:string;
    setName:(name:string)=> void;
}

export const useNameStore= create<nameStore>((set)=>({
    name:'',
    setName: (name:string)=>set({name:name}),
}))
