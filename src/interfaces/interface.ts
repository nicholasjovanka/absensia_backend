export interface Credentials {
	ref: { id: string };
	ts: number;
	instance: { id: string };
	secret: string;
}

export interface Organization {
    organization_name: string;
}

export interface Data<T>{
    ref: {id:string},
    ts: number,
    data: T
}

export interface ShiftEntryDetails {
    shift_entry_id: string,
    shift_name: string,
    shift_start_time: string,
    shift_end_time: string,
    username: string,
    clock_in: string,
    clock_out: string,
    overtime_enabled: boolean,
    overtime_duration: number,
    status: string,
    location_name: string,
    image_url: string,
    image_clock_out_url: string,
    forgot_clockout: boolean,
    is_late: boolean
}

export interface FaceRecogResponse{
    result: boolean
}

export interface DashboardStatistics{
    shift_entry_total: number,
    in_progress: number,
    pending: number,
    overtime_enabled: number,
    late_attendance: number,
    completed: number,
    absents: number,
    forgot_clockout: number
    shifts_with_overtime_enabled: number,
    late_percentage: number,
    attendance_percentage: number,
    empty: boolean
}


export interface PaginateArray<T> extends Data<T>{
    current_page: number,
    total_page: number,
    total_size:number
}

export interface ShiftList extends Data<ShiftListItem>{
    total_data:number
}

export interface ShiftListItem{
    shift_id: string,
    shift_name: string
}

export interface Account{
    name: string,
    role: string,
    email: string,
    organization_id: string,
    s3_image: string,
    birthdate:string,
    address?:string,
    phonenumber?:string
}

export interface AuthorizeToken{
    status: string,
    user_id:string;
}

export interface Locations{
    id?:string,
    location_name: string,
    location_coordinates: Array<number>
    organization_id: string
}

export interface Shifts{
    shift_name: string,
    start_time: string,
    end_time: string,
    approved: boolean,
    location_id: string,
    organization_id:string
}

export interface ShiftEntry{
    user_id: string,
    status: string,
    clock_in?:string,
    clock_out?:string,
    shift_id: string,
    is_late?:boolean,
    overtime_duration?:number,
    overtime_enabled:boolean,
    forgot_clockout?:boolean,
    image_url?:string,
    image_clock_out_url?: string
}

export interface LocationFunction{
    location_coordinates:Array<number>
}

export interface CronArray {
    data:{
        absent: Array<Data<ShiftEntry>>,
        ot_enabled: Array<Data<ShiftEntry>>,
        ot_disabled: Array<Data<ShiftEntry>>,
    }
}

export interface ShiftPaginateData{
    shift_id: string,
    shift_name: string,
    start_date: string,
    start_time: string,
    end_date: string,
    end_time: string,
    approved: boolean,
    location_name: string,
    location_id: string
}

export interface ShiftEntriesPaginateData{
    shift_entry_id: string,
    shift_name: string,
    shift_id: string,
    username: string,
    start_time: string,
    end_time: string,
    clock_in: string,
    clock_out: string,
    overtime_enabled: boolean,
    status: string,
    date:string,
    location_name: string,
    location_id: string,
    forgot_clockout: boolean,
    is_late: boolean
}

export interface ShiftEntryUserListItem{
    user_name:string,
    user_id:string
}


export interface ShiftEntryUserList{
    existing_user_list: ShiftEntryUserListItem[],
    unadded_user: ShiftEntryUserListItem[]
}


export interface ShiftEntriesUserPaginateData{
    shift_entry_id: string,
    shift_name: string,
    shift_id: string,
    user_id: string,
    username: string,
    start_time: string,
    end_time: string,
    location_name: string,
    location_id: string,
    location_coordinates: Array<number>,
    clock_in: string,
    clock_out: string,
    date:string
}


export interface UserPaginateData{
    user_id: string,
    name: string,
    email: string,
    address: string,
    birthdate: string,
    phonenumber: string,
}