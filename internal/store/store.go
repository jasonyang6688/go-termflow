package store

import (
	"database/sql"
	_ "modernc.org/sqlite"
)

type Connection struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Host      string `json:"host"`
	Port      int    `json:"port"`
	User      string `json:"user"`
	Password  string `json:"password,omitempty"`
	KeyPath   string `json:"keyPath"`
	Env       string `json:"env"`
	GroupName string `json:"groupName"`
}

type QuickCommand struct {
	ID           int64  `json:"id"`
	Label        string `json:"label"`
	Command      string `json:"command"`
	ConnectionID *int64 `json:"connectionId,omitempty"`
	SortOrder    int    `json:"sortOrder"`
}

type Store struct {
	db *sql.DB
}

func New(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, err
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) SaveConnection(c Connection) (int64, error) {
	res, err := s.db.Exec(
		`INSERT INTO connections (name,host,port,user,password,key_path,env,group_name)
		 VALUES (?,?,?,?,?,?,?,?)`,
		c.Name, c.Host, c.Port, c.User, c.Password, c.KeyPath, c.Env, c.GroupName,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (s *Store) GetConnection(id int64) (Connection, error) {
	var c Connection
	row := s.db.QueryRow(
		`SELECT id,name,host,port,user,COALESCE(password,''),COALESCE(key_path,''),env,COALESCE(group_name,'')
		 FROM connections WHERE id=?`, id,
	)
	return c, row.Scan(&c.ID, &c.Name, &c.Host, &c.Port, &c.User, &c.Password, &c.KeyPath, &c.Env, &c.GroupName)
}

func (s *Store) ListConnections() ([]Connection, error) {
	rows, err := s.db.Query(
		`SELECT id,name,host,port,user,COALESCE(password,''),COALESCE(key_path,''),env,COALESCE(group_name,'')
		 FROM connections ORDER BY group_name, name`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Connection
	for rows.Next() {
		var c Connection
		if err := rows.Scan(&c.ID, &c.Name, &c.Host, &c.Port, &c.User, &c.Password, &c.KeyPath, &c.Env, &c.GroupName); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) DeleteConnection(id int64) error {
	_, err := s.db.Exec(`DELETE FROM connections WHERE id=?`, id)
	return err
}

func (s *Store) ListQuickCommands() ([]QuickCommand, error) {
	rows, err := s.db.Query(
		`SELECT id,label,command,connection_id,sort_order FROM quick_commands ORDER BY sort_order`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []QuickCommand
	for rows.Next() {
		var q QuickCommand
		if err := rows.Scan(&q.ID, &q.Label, &q.Command, &q.ConnectionID, &q.SortOrder); err != nil {
			return nil, err
		}
		out = append(out, q)
	}
	return out, rows.Err()
}

func (s *Store) SaveQuickCommand(q QuickCommand) error {
	_, err := s.db.Exec(
		`INSERT INTO quick_commands (label,command,sort_order) VALUES (?,?,?)`,
		q.Label, q.Command, q.SortOrder,
	)
	return err
}
