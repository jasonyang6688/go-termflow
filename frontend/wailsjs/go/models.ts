export namespace main {
	
	export class ConnectResult {
	    sessionId: string;
	
	    static createFrom(source: any = {}) {
	        return new ConnectResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sessionId = source["sessionId"];
	    }
	}

}

export namespace store {
	
	export class Connection {
	    id: number;
	    name: string;
	    host: string;
	    port: number;
	    user: string;
	    password?: string;
	    keyPath: string;
	    env: string;
	    groupName: string;
	
	    static createFrom(source: any = {}) {
	        return new Connection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.user = source["user"];
	        this.password = source["password"];
	        this.keyPath = source["keyPath"];
	        this.env = source["env"];
	        this.groupName = source["groupName"];
	    }
	}
	export class QuickCommand {
	    id: number;
	    label: string;
	    command: string;
	    connectionId?: number;
	    sortOrder: number;
	
	    static createFrom(source: any = {}) {
	        return new QuickCommand(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.command = source["command"];
	        this.connectionId = source["connectionId"];
	        this.sortOrder = source["sortOrder"];
	    }
	}

}

