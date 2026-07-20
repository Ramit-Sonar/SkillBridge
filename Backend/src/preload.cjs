const dns = require("dns");

// Force Node DNS resolution through public resolvers for local network consistency.
dns.setServers(["8.8.8.8", "8.8.4.4"]);
