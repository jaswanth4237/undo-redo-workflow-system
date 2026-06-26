import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Undo/Redo Workflow',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple, brightness: Brightness.dark),
        useMaterial3: true,
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  final String baseUrl = 'http://localhost:3000';
  Map<String, dynamic> state = {'document': {'content': ''}, 'tasks': []};
  final TextEditingController _docController = TextEditingController();
  final TextEditingController _taskController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchState();
  }

  Future<void> _fetchState() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/state'));
      if (response.statusCode == 200) {
        setState(() {
          state = json.decode(response.body);
          _docController.text = state['document']['content'];
        });
      }
    } catch (e) {
      print('Error fetching state: $e');
    }
  }

  Future<void> _performAction(String path, [Map<String, dynamic>? body]) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$path'),
        headers: {'Content-Type': 'application/json'},
        body: body != null ? json.encode(body) : null,
      );
      if (response.statusCode == 200) {
        _fetchState();
      }
    } catch (e) {
      print('Error performing action: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Undo/Redo System'),
        actions: [
          IconButton(icon: const Icon(Icons.undo), onPressed: () => _performAction('/action/undo')),
          IconButton(icon: const Icon(Icons.redo), onPressed: () => _performAction('/action/redo')),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _docController,
              decoration: const InputDecoration(labelText: 'Document Content', border: OutlineInputBorder()),
              onSubmitted: (val) => _performAction('/action/document/update', {'content': val}),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _taskController,
                    decoration: const InputDecoration(labelText: 'New Task', border: OutlineInputBorder()),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: () {
                    if (_taskController.text.isNotEmpty) {
                      _performAction('/action/tasks/add', {'text': _taskController.text});
                      _taskController.clear();
                    }
                  },
                )
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                const Text('Tasks', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    final ids = (state['tasks'] as List).map((t) => t['id'] as String).toList();
                    _performAction('/action/tasks/bulk-delete', {'taskIds': ids});
                  },
                  child: const Text('Bulk Delete All'),
                )
              ],
            ),
            Expanded(
              child: ListView.builder(
                itemCount: (state['tasks'] as List).length,
                itemBuilder: (context, index) {
                  final task = state['tasks'][index];
                  return ListTile(
                    leading: Checkbox(
                      value: task['completed'],
                      onChanged: (_) => _performAction('/action/tasks/complete/${task['id']}'),
                    ),
                    title: Text(task['text']),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete),
                      onPressed: () => _performAction('/action/tasks/delete/${task['id']}'),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
