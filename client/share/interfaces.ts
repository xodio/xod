export interface IModel {
	id: number
}

export interface IServiceState {
	models: Map<number, any>,
	selected: any,
	count: number
}