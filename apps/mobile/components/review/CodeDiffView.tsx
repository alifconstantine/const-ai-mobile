import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  FileCode,
  Check,
  Undo2,
  ExternalLink,
  ChevronDown,
  FileText,
} from "lucide-react-native";

interface DiffLine {
  lineNum: number;
  type: "add" | "delete" | "normal";
  content: string;
}

const SAMPLE_DIFF: DiffLine[] = [
  { lineNum: 1, type: "add", content: "const http = require('http');" },
  { lineNum: 2, type: "add", content: "const fs = require('fs');" },
  { lineNum: 3, type: "add", content: "const path = require('path');" },
  { lineNum: 4, type: "normal", content: "" },
  { lineNum: 5, type: "add", content: "const PORT = 8000;" },
  { lineNum: 6, type: "add", content: "const MIME = {" },
  { lineNum: 7, type: "add", content: "  '.html': 'text/html'," },
  { lineNum: 8, type: "add", content: "  '.css': 'text/css'," },
  { lineNum: 9, type: "add", content: "  '.js': 'application/javascript'," },
  { lineNum: 10, type: "add", content: "  '.json': 'application/json'," },
  { lineNum: 11, type: "add", content: "  '.mp3': 'audio/mpeg'," },
  { lineNum: 12, type: "add", content: "  '.opus': 'audio/opus'," },
  { lineNum: 13, type: "add", content: "  '.ogg': 'audio/ogg'," },
  { lineNum: 14, type: "add", content: "  '.png': 'image/png'" },
  { lineNum: 15, type: "add", content: "};" },
  { lineNum: 16, type: "normal", content: "" },
  { lineNum: 17, type: "add", content: "const server = http.createServer((req, res) => {" },
  { lineNum: 18, type: "add", content: "  let filePath = '.' + req.url.split('?')[0];" },
  { lineNum: 19, type: "add", content: "  if (filePath === './') filePath = './index.html';" },
  { lineNum: 20, type: "normal", content: "" },
  { lineNum: 21, type: "add", content: "  const ext = path.extname(filePath);" },
  { lineNum: 22, type: "add", content: "  const contentType = MIME[ext] || 'application/octet-stream';" },
  { lineNum: 23, type: "normal", content: "" },
  { lineNum: 24, type: "add", content: "  fs.readFile(filePath, (err, content) => {" },
  { lineNum: 25, type: "add", content: "    if (err) {" },
  { lineNum: 26, type: "add", content: "      if (err.code === 'ENOENT') {" },
  { lineNum: 27, type: "add", content: "        res.writeHead(404, { 'Content-Type': 'text/plain' });" },
  { lineNum: 28, type: "add", content: "        res.end('404 Not Found');" },
  { lineNum: 29, type: "add", content: "      } else {" },
  { lineNum: 30, type: "add", content: "        res.writeHead(500, { 'Content-Type': 'text/plain' });" },
  { lineNum: 31, type: "add", content: "        res.end('500 Internal Error');" },
  { lineNum: 32, type: "add", content: "      }" },
  { lineNum: 33, type: "add", content: "    } else {" },
  { lineNum: 34, type: "add", content: "      res.writeHead(200, { 'Content-Type': contentType });" },
  { lineNum: 35, type: "add", content: "      res.end(content, 'utf-8');" },
  { lineNum: 36, type: "add", content: "    }" },
  { lineNum: 37, type: "add", content: "  });" },
  { lineNum: 38, type: "add", content: "});" },
  { lineNum: 39, type: "normal", content: "" },
  { lineNum: 40, type: "add", content: "server.listen(PORT, () => {" },
  { lineNum: 41, type: "add", content: "  console.log(`Server running at http://localhost:${PORT}/`);" },
  { lineNum: 42, type: "add", content: "});" },
];

export const CodeDiffView: React.FC = () => {
  const [isReviewed, setIsReviewed] = useState(false);

  return (
    <View style={styles.container}>
      {/* File Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.fileInfo}>
          <View style={styles.fileIconBadge}>
            <Text style={styles.jsBadge}>JS</Text>
          </View>
          <Text style={styles.fileName}>server.js</Text>
          <View style={styles.diffPill}>
            <Text style={styles.diffAdd}>+42</Text>
            <Text style={styles.diffDel}>-0</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btnReview, isReviewed && styles.btnReviewed]}
            onPress={() => setIsReviewed(!isReviewed)}
          >
            {isReviewed ? (
              <Check size={12} color="#22c55e" />
            ) : (
              <Text style={styles.btnReviewText}>Review</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnOpen}>
            <Text style={styles.btnOpenText}>Open</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnUndo}>
            <Undo2 size={13} color="#a1a1aa" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Code Viewer */}
      <ScrollView
        style={styles.codeScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <ScrollView style={styles.verticalScroll} bounces={false}>
          <View style={styles.codeContainer}>
            {SAMPLE_DIFF.map((line, index) => {
              const isAdd = line.type === "add";
              const isDel = line.type === "delete";

              return (
                <View
                  key={index}
                  style={[
                    styles.lineRow,
                    isAdd && styles.lineAdd,
                    isDel && styles.lineDel,
                  ]}
                >
                  <Text
                    style={[
                      styles.lineNumber,
                      isAdd && styles.lineNumberAdd,
                      isDel && styles.lineNumberDel,
                    ]}
                  >
                    {line.lineNum}
                  </Text>
                  <Text
                    style={[
                      styles.lineCode,
                      isAdd && styles.lineCodeAdd,
                      isDel && styles.lineCodeDel,
                    ]}
                  >
                    {line.content}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d1117",
    display: "flex",
    flexDirection: "column",
  },
  headerBar: {
    height: 40,
    backgroundColor: "#161b22",
    borderBottomWidth: 1,
    borderBottomColor: "#30363d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fileIconBadge: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: "#eab308",
    alignItems: "center",
    justifyContent: "center",
  },
  jsBadge: {
    color: "#000",
    fontSize: 9,
    fontWeight: "bold",
  },
  fileName: {
    color: "#e6edf3",
    fontSize: 12.5,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  diffPill: {
    flexDirection: "row",
    gap: 3,
    backgroundColor: "#21262d",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffAdd: {
    color: "#3fb950",
    fontSize: 11,
    fontWeight: "bold",
  },
  diffDel: {
    color: "#f85149",
    fontSize: 11,
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  btnReview: {
    backgroundColor: "#21262d",
    borderWidth: 1,
    borderColor: "#30363d",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  btnReviewed: {
    backgroundColor: "#132e22",
    borderColor: "#238636",
  },
  btnReviewText: {
    color: "#c9d1d9",
    fontSize: 11,
    fontWeight: "500",
  },
  btnOpen: {
    backgroundColor: "#21262d",
    borderWidth: 1,
    borderColor: "#30363d",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  btnOpenText: {
    color: "#c9d1d9",
    fontSize: 11,
    fontWeight: "500",
  },
  btnUndo: {
    padding: 4,
    borderRadius: 4,
  },
  codeScroll: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  codeContainer: {
    paddingVertical: 4,
    minWidth: 460,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 1,
    paddingHorizontal: 4,
  },
  lineAdd: {
    backgroundColor: "rgba(46, 160, 67, 0.15)",
  },
  lineDel: {
    backgroundColor: "rgba(248, 81, 73, 0.15)",
  },
  lineNumber: {
    width: 32,
    color: "#484f58",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "right",
    paddingRight: 8,
    userSelect: "none",
  },
  lineNumberAdd: {
    color: "#3fb950",
  },
  lineNumberDel: {
    color: "#f85149",
  },
  lineCode: {
    color: "#c9d1d9",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    flex: 1,
  },
  lineCodeAdd: {
    color: "#7ee787",
  },
  lineCodeDel: {
    color: "#ffa198",
  },
});
