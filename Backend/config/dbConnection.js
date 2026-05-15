const users = [];
let nextId = 1;

const mockPool = {
  query: async (text, params) => {
    console.log("MOCK DB QUERY:", text.trim().substring(0, 100));
    
    // Mock user creation
    if (text.includes('INSERT INTO users')) {
      const newUser = { 
        id: nextId++, 
        uuid: 'mock-uuid-' + Date.now(), 
        first_name: params[0] || 'User', 
        last_name: params[1] || 'Mock', 
        email: params[2], 
        username: params[3], 
        password: params[4],
        role: params[5],
        department: params[6],
        student_id: params[7]
      };
      users.push(newUser);
      return { rows: [newUser], rowCount: 1 };
    }
    
    // Mock user lookup
    if (text.includes('SELECT * FROM users WHERE email')) {
      const user = users.find(u => u.email === params[0]);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    
    if (text.includes('SELECT * FROM users WHERE username')) {
      const user = users.find(u => u.username === params[0]);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (text.includes('INSERT INTO students') || text.includes('INSERT INTO professors')) {
      return { rows: [{ id: 1 }], rowCount: 1 };
    }
    
    if (text.includes('RETURNING')) {
       return { rows: [{ id: 1, uuid: 'mock-uuid' }], rowCount: 1 };
    }

    // Default mock response
    return { rows: [], rowCount: 0 };
  },
  on: (event, cb) => {
    if (event === 'connect') {
      setTimeout(() => cb(), 100);
    }
  },
  connect: async () => {
    return {
      query: mockPool.query,
      release: () => {}
    };
  },
  end: async () => {}
};

console.log('⚠️ Running with MOCKED Database Connection (In-Memory) ⚠️');
module.exports = mockPool;
