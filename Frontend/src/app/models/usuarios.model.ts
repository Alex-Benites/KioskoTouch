export interface User{
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_superuser: boolean;
    groups: string[];
    permissions: string[];
    empleado?: Empleado;
}

export interface Empleado {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    sexo?: string;
}

export interface LoginResponse{
    access_token: string;
    refresh_token: string;
    user: User;
}

export interface LoginRequest{
    email_or_username: string;
    password: string;
}

export interface ApiResponse<T>{
    valid?: boolean;
    message?: string;
    error?: string;
    user?: T;
}